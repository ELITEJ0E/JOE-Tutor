import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUp, AudioLines, ChevronDown, Cpu, ImagePlus, Mic, MicOff, Moon, RotateCcw, Settings2, Sparkles, Volume2, VolumeX, WandSparkles, X } from 'lucide-react';
import AvatarStage from './AvatarStage';

type Msg = { role: 'user' | 'assistant'; content: string };
const storeKey = 'joe-tutor-mei-preferences-v1';
type Options = { backend: string; model: string; speech: boolean };
const INITIAL: Options = { backend: 'http://127.0.0.1:7860', model: 'qwen2.5:1.5b', speech: true };
const WELCOME = 'Hey, I’m Mei. Your little corner of calm. How was your day?';
function getSaved(): Options {
  try { return { ...INITIAL, ...JSON.parse(localStorage.getItem(storeKey) || '{}') }; } catch { return INITIAL; }
}
function makeWav(float: Float32Array, sampleRate: number): Blob {
  const samples = Math.floor(float.length * 16000 / sampleRate);
  const out = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(out);
  const put = (at: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(at + i, str.charCodeAt(i)); };
  put(0, 'RIFF'); view.setUint32(4, out.byteLength - 8, true); put(8, 'WAVE'); put(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  put(36, 'data'); view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) {
    const x = float[Math.min(float.length - 1, Math.floor(i * sampleRate / 16000))];
    view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, x * 32767)), true);
  }
  return new Blob([out], { type: 'audio/wav' });
}
const trim = (url: string) => url.trim().replace(/\/+$/, '');
const isSafeLocalUrl = (url: string) => {
  try { const u = new URL(url); return u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname); } catch { return false; }
};

export default function MeiStudio({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState<Options>(getSaved);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: WELCOME }]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const levelRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundSource = useRef<AudioBufferSourceNode | null>(null);
  const micRef = useRef<{ stream: MediaStream; context: AudioContext; processor: ScriptProcessorNode; source: MediaStreamAudioSourceNode; chunks: Float32Array[]; sampleRate: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastPhoto = useRef<string | null>(null);
  const lastModel = useRef<string | null>(null);
  const recordingRef = useRef(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => { localStorage.setItem(storeKey, JSON.stringify(prefs)); }, [prefs]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!isSafeLocalUrl(prefs.backend)) { setStatus('offline'); return; }
      try {
        const r = await fetch(trim(prefs.backend) + '/api/status', { signal: AbortSignal.timeout(2500) });
        if (!cancelled) setStatus(r.ok ? 'online' : 'offline');
      } catch { if (!cancelled) setStatus('offline'); }
    };
    setStatus('checking');
    check();
    const timer = setInterval(check, 20000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [prefs.backend]);

  useEffect(() => () => {
    if (lastPhoto.current) URL.revokeObjectURL(lastPhoto.current);
    if (lastModel.current) URL.revokeObjectURL(lastModel.current);
    try { soundSource.current?.stop(); } catch {}
    micRef.current?.stream.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();
  }, []);

  const onUpload = (file: File) => {
    if (file.size > 35 * 1024 * 1024) { setNotice('For best performance, choose an avatar under 35 MB.'); return; }
    const isModel = /\.glb$/i.test(file.name);
    const isImage = /\.(png|jpe?g|webp)$/i.test(file.name);
    if (!isModel && !isImage) { setNotice('Please import a .glb, .png, .jpg, or .webp file.'); return; }
    const url = URL.createObjectURL(file);
    if (isModel) {
      if (lastModel.current) URL.revokeObjectURL(lastModel.current);
      lastModel.current = url;
      setModelUrl(url);
    } else {
      if (lastPhoto.current) URL.revokeObjectURL(lastPhoto.current);
      lastPhoto.current = url;
      setPortraitUrl(url);
      setModelUrl(null);
    }
    setNotice(isModel ? '3D model imported. Facial movement depends on its blendshapes.' : 'Portrait imported. Animation mode is now active.');
  };
  const stopSpeech = () => {
    try { soundSource.current?.stop(); } catch {}
    soundSource.current = null;
    levelRef.current = 0;
    setSpeaking(false);
  };

  async function playSpeech(content: string) {
    if (!prefs.speech || !isSafeLocalUrl(prefs.backend)) return;
    try {
      const response = await fetch(trim(prefs.backend) + '/api/speak', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: content.slice(0, 500) }),
      });
      if (!response.ok) throw new Error('Voice service is unavailable.');
      const bytes = await response.arrayBuffer();
      if (!audioContextRef.current) audioContextRef.current = new AudioContext();
      const ctx = audioContextRef.current;
      if (ctx.state !== 'running') await ctx.resume();
      const audio = await ctx.decodeAudioData(bytes.slice(0));
      stopSpeech();
      const source = ctx.createBufferSource();
      soundSource.current = source;
      source.buffer = audio;
      source.connect(ctx.destination);
      const channel = audio.getChannelData(0);
      const slice = 1024;
      const envelopes: number[] = [];
      for (let i = 0; i < channel.length; i += slice) {
        let rms = 0;
        const end = Math.min(channel.length, i + slice);
        for (let j = i; j < end; j++) rms += channel[j] * channel[j];
        envelopes.push(Math.sqrt(rms / (end - i)));
      }
      const start = ctx.currentTime;
      setSpeaking(true);
      const animate = () => {
        if (soundSource.current !== source) return;
        const index = Math.min(envelopes.length - 1, Math.floor((ctx.currentTime - start) * audio.sampleRate / slice));
        levelRef.current = envelopes[Math.max(0, index)] || 0;
        if (ctx.currentTime - start < audio.duration) requestAnimationFrame(animate);
      };
      source.onended = () => {
        if (soundSource.current === source) { soundSource.current = null; levelRef.current = 0; setSpeaking(false); }
      };
      source.start();
      animate();
    } catch {
      setNotice('The response arrived, but local TTS could not play. Check the Mei voice backend.');
      setSpeaking(false);
    }
  }

  async function send(message: string, fromVoice = false) {
    const input = message.trim();
    if (!input || busy || !isSafeLocalUrl(prefs.backend)) return;
    stopSpeech();
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    if (!fromVoice) setText('');
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch(trim(prefs.backend) + '/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: input }),
      });
      if (!response.ok) throw new Error('Ollama did not respond. Check your local Mei service.');
      const body = await response.json();
      const reply = String(body.reply || '').trim();
      if (!reply) throw new Error('Mei returned an empty reply.');
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      await playSpeech(reply);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to reach the local service.');
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    if (recordingRef.current || busy) return;
    if (!isSafeLocalUrl(prefs.backend)) { setNotice('Use a local backend at 127.0.0.1 or localhost.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const chunks: Float32Array[] = [];
      source.connect(processor);
      processor.connect(context.destination);
      processor.onaudioprocess = e => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      micRef.current = { stream, context, processor, source, chunks, sampleRate: context.sampleRate };
      recordingRef.current = true;
      setListening(true);
    } catch { setNotice('Microphone access was denied or unavailable.'); }
  }

  async function stopRecording() {
    const mic = micRef.current;
    if (!mic) return;
    micRef.current = null;
    recordingRef.current = false;
    setListening(false);
    mic.processor.disconnect();
    mic.source.disconnect();
    mic.stream.getTracks().forEach(track => track.stop());
    await mic.context.close();
    const n = mic.chunks.reduce((s, c) => s + c.length, 0);
    if (!n) return;
    const samples = new Float32Array(n);
    let offset = 0;
    mic.chunks.forEach(c => { samples.set(c, offset); offset += c.length; });
    if (samples.length / mic.sampleRate > 25) { setNotice('Keep voice messages under 25 seconds.'); return; }
    setBusy(true);
    setNotice('Transcribing your voice…');
    try {
      const form = new FormData();
      form.append('audio', makeWav(samples, mic.sampleRate), 'speech.wav');
      const response = await fetch(trim(prefs.backend) + '/api/voice', { method: 'POST', body: form });
      if (!response.ok) throw new Error('Whisper speech recognition failed.');
      const result = await response.json();
      setNotice('');
      if (result.no_speech || !result.transcript) return;
      setMessages(prev => [...prev, { role: 'user', content: result.transcript }, { role: 'assistant', content: result.reply }]);
      await playSpeech(result.reply);
    } catch { setNotice('Could not process your voice. Check the local Whisper backend.'); } finally { setBusy(false); }
  }

  const phrases = ['Tell me something interesting', 'Help me unwind', 'Let’s practice Mandarin'];
  return <div className="mei-app-shell">
    <aside className="mei-sidebar">
      <div className="mei-sidebar-brand"><span className="mei-brand-icon"><Sparkles size={24}/></span><div><strong>JOE<span> / MEI</span></strong><small>COMPANION STUDIO</small></div></div>
      <div className="mei-sidebar-section"><span>YOUR SPACES</span>
        <button className="mei-side-item" onClick={onBack}><ArrowLeft size={18}/> Tutor workspace</button>
        <button className="mei-side-item mei-side-item--active"><Moon size={18}/> Mei Studio <span className="mei-mini-dot"/></button>
      </div>
      <div className="mei-sidebar-section"><span>PERSONALIZE</span>
        <button className="mei-side-item" onClick={() => setSettingsOpen(v => !v)}><Settings2 size={18}/> Local AI settings <ChevronDown size={14}/></button>
        <label className="mei-side-item mei-file-trigger"><ImagePlus size={18}/> Change avatar <input type="file" accept=".glb,.png,.jpg,.jpeg,.webp" hidden onChange={e => { if(e.target.files?.[0]) onUpload(e.target.files[0]); e.currentTarget.value=''; }}/></label>
        <button className="mei-side-item" onClick={() => { setMessages([{role:'assistant',content:WELCOME}]); setNotice('New conversation started.'); }}><RotateCcw size={18}/> New conversation</button>
      </div>
      <div className="mei-sidebar-bottom"><span className={'mei-connection ' + (status === 'online' ? 'connected' : '')}><span className="mei-mini-dot"/> {status === 'online' ? 'LOCAL AI CONNECTED' : status === 'checking' ? 'CHECKING LOCAL AI' : 'LOCAL AI OFFLINE'}</span><p>Private by default. Conversations run through your local backend, not through the tutor’s Gemini voice API.</p></div>
    </aside>
    <main className="mei-main">
      <header className="mei-main-header"><div><div className="mei-header-eyebrow">YOUR PRIVATE SPACE <span> / </span> STUDIO</div><h1>A little closer to <em>real.</em></h1></div><div className="mei-header-actions"><span className="mei-header-mode"><Cpu size={15}/> Lightweight motion</span><button title="Local AI settings" onClick={() => setSettingsOpen(v => !v)}><Settings2 size={18}/></button><button title="Back to JOE Tutor" onClick={onBack}><X size={19}/></button></div></header>
      {settingsOpen && <section className="mei-settings"><div><strong><Settings2 size={16}/> Local engine</strong><p>Start the separately installed Mei browser backend on your Windows PC. A hosted deployment cannot access Ollama on a visitor’s computer without a reachable local service and correct CORS configuration.</p></div>
        <label>Backend address<input value={prefs.backend} onChange={e => setPrefs(p => ({ ...p, backend: e.target.value }))}/></label>
        <label>Ollama model<input value={prefs.model} onChange={e => setPrefs(p => ({ ...p, model: e.target.value }))}/></label>
        <span>Selected model is informational; change OLLAMA_MODEL in the local backend’s .env to actually switch models.</span>
      </section>}
      <div className="mei-content-grid">
        <div className="mei-visual-column">
          <AvatarStage portraitUrl={portraitUrl} modelUrl={modelUrl} audioLevel={levelRef} speaking={speaking} thinking={busy} onUpload={onUpload}/>
          <div className="mei-visual-note"><span><WandSparkles size={17}/> Real-time expression engine</span><span>CPU-friendly avatar rendering, facial morph targets when supported</span></div>
        </div>
        <section className="mei-chat-panel">
          <div className="mei-chat-header"><div className="mei-chat-photo"><Sparkles size={21}/></div><div><strong>Mei</strong><span>{speaking ? 'Speaking to you...' : busy ? 'Thinking...' : status === 'online' ? 'Here with you' : 'Waiting for local engine'}</span></div><button onClick={() => setPrefs(p => ({...p,speech:!p.speech}))} title={prefs.speech ? 'Mute voice responses' : 'Enable voice responses'}>{prefs.speech ? <Volume2 size={19}/> : <VolumeX size={19}/>}</button></div>
          <div className="mei-message-log">{messages.map((m,i) => <div className={'mei-message mei-message--' + m.role} key={i}><span>{m.role === 'assistant' ? 'MEI' : 'YOU'}</span><p>{m.content}</p></div>)}<div ref={bottomRef}/>{busy && <div className="mei-thinking"><span/><span/><span/></div>}</div>
          {notice && <div className="mei-notice"><span>{notice}</span><button onClick={() => setNotice('')}><X size={14}/></button></div>}
          <div className="mei-composer-area">
            {messages.length < 3 && <div className="mei-suggestions">{phrases.map(p => <button key={p} onClick={() => send(p)} disabled={busy || status !== 'online'}>{p}</button>)}</div>}
            <div className="mei-composer"><textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); send(text); } }} placeholder="Say anything to Mei..." rows={2}/>
              <div><button className={'mei-mic-button ' + (listening ? 'is-listening' : '')} title="Hold to speak" disabled={busy || status !== 'online'} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); startRecording(); }} onPointerUp={stopRecording} onPointerCancel={stopRecording}>{listening ? <MicOff size={21}/> : <Mic size={21}/>}</button><button className="mei-send-button" onClick={() => send(text)} disabled={busy || !text.trim() || status !== 'online'}><ArrowUp size={19}/></button></div></div>
            <span className="mei-composer-caption"><AudioLines size={13}/> Local Ollama + Whisper + TTS · hold microphone to speak</span>
          </div>
        </section>
      </div>
    </main>
  </div>;
}
