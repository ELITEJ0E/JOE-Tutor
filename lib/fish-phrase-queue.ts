/**
 * Queue Gemini Live output transcription as short, natural speech phrases.
 * Fetch up to two Fish Audio segments in parallel; always play them in order.
 * A generation token and AbortControllers prevent stale speech on interruption.
 */
export type FishVoiceId = 'tian_xi_wei' | 'hao_zh';

type SpeechSegment = {
  text: string;
  abort: AbortController | null;
  audio: Promise<Blob> | null;
};

export type FishPhraseQueueOptions = {
  getVoice: () => FishVoiceId | null;
  fetchAudio: (voice: FishVoiceId, text: string, signal: AbortSignal) => Promise<Blob>;
  playAudio: (voice: FishVoiceId, audio: Blob, signal: AbortSignal) => Promise<void>;
  stopPlayback: () => void;
  setStatus: (status: string) => void;
};

const MAX_PHRASE_LENGTH = 150;
const FIRST_PHRASE_MIN = 12;
const REQUEST_LIMIT = 2;

// Split only at natural punctuation, preferably a full sentence. A sufficiently
// long comma clause is allowed to reduce time-to-first-audio for Mandarin.
function findPhraseBreak(text: string): number {
  const sentence = /[。！？!?；;\n]/g;
  let match: RegExpExecArray | null;
  while ((match = sentence.exec(text))) {
    if (match.index + 1 >= FIRST_PHRASE_MIN) return match.index + 1;
  }
  if (text.length >= 48) {
    const comma = /[，,]/g;
    while ((match = comma.exec(text))) {
      if (match.index + 1 >= 22) return match.index + 1;
    }
  }
  if (text.length < MAX_PHRASE_LENGTH) return -1;
  const natural = Math.max(text.lastIndexOf('，', MAX_PHRASE_LENGTH), text.lastIndexOf(',', MAX_PHRASE_LENGTH));
  return natural >= 20 ? natural + 1 : MAX_PHRASE_LENGTH;
}

export class FishPhraseQueue {
  private readonly options: FishPhraseQueueOptions;
  private pending = '';
  private segments: SpeechSegment[] = [];
  private runId = 0;
  private draining = false;
  private turnFinished = false;
  private receivedText = false;
  private playbackAbort: AbortController | null = null;

  constructor(options: FishPhraseQueueOptions) {
    this.options = options;
  }

  get hasReceivedText(): boolean {
    return this.receivedText;
  }

  pushTranscript(delta: string): void {
    const voice = this.options.getVoice();
    if (!voice || !delta) return;
    if (this.turnFinished) this.cancel();
    this.receivedText = true;
    this.pending += delta;
    this.extractPhrases(false);
  }

  completeTurn(): boolean {
    if (!this.receivedText) return false;
    this.turnFinished = true;
    this.extractPhrases(true);
    this.prefetch();
    this.drain();
    return true;
  }

  cancel(): void {
    this.runId += 1;
    this.playbackAbort?.abort();
    this.playbackAbort = null;
    for (const segment of this.segments) segment.abort?.abort();
    this.segments = [];
    this.pending = '';
    this.draining = false;
    this.turnFinished = false;
    this.receivedText = false;
    this.options.stopPlayback();
  }

  private extractPhrases(final: boolean): void {
    while (this.pending.trim()) {
      const end = findPhraseBreak(this.pending);
      if (end < 0) break;
      const text = this.pending.slice(0, end).trim();
      this.pending = this.pending.slice(end);
      if (text) this.segments.push({ text, abort: null, audio: null });
    }
    if (final && this.pending.trim()) {
      this.segments.push({ text: this.pending.trim(), abort: null, audio: null });
      this.pending = '';
    }
    if (this.segments.length) {
      this.prefetch();
      this.drain();
    }
  }

  private prefetch(): void {
    const voice = this.options.getVoice();
    if (!voice) return;
    // A queued segment stays counted until playback completes. This caps
    // the number of requested / already downloaded segments and API usage.
    let prepared = this.segments.filter(item => item.audio !== null).length;
    for (const item of this.segments) {
      if (prepared >= REQUEST_LIMIT) break;
      if (item.audio) continue;
      const abort = new AbortController();
      item.abort = abort;
      item.audio = this.options.fetchAudio(voice, item.text, abort.signal);
      // Attach a handler immediately: prefetch errors must not become
      // unhandled rejections while an earlier phrase is speaking.
      void item.audio.catch(() => {});
      prepared += 1;
    }
  }

  private async drain(): Promise<void> {
    if (this.draining || !this.segments.length) return;
    this.draining = true;
    const currentRun = this.runId;
    try {
      while (currentRun === this.runId && this.segments.length > 0) {
        this.prefetch();
        const segment = this.segments[0];
        if (!segment.audio) break;
        this.options.setStatus('Generating voice');
        const audio = await segment.audio;
        if (currentRun !== this.runId) return;
        if (!audio.size) throw new Error('Fish Audio returned an empty MP3');

        const voice = this.options.getVoice();
        if (!voice) return;
        const playbackAbort = new AbortController();
        this.playbackAbort = playbackAbort;
        await this.options.playAudio(voice, audio, playbackAbort.signal);
        if (currentRun !== this.runId) return;
        this.playbackAbort = null;
        // Remove only the segment that finished; a new turn may cancel the
        // whole queue while fetch/play callbacks are running.
        this.segments.shift();
        this.prefetch();
      }
      if (currentRun === this.runId) {
        this.options.setStatus(this.turnFinished ? 'Waiting' : 'Thinking');
      }
    } catch (error) {
      if (currentRun === this.runId) {
        console.error('Fish phrase playback failed:', error);
        this.cancel();
        this.options.setStatus('Fish Audio unavailable');
      }
    } finally {
      if (currentRun === this.runId) this.draining = false;
    }
  }
}
