/**
 * Consistent playback loudness for separately synthesized Fish Speech phrases.
 * Estimate active speech rather than silence, to avoid boosting quiet pauses.
 * This changes local playback gain only, not voice identity or Fish API settings.
 */
export function estimateSpeechPlaybackGain(audio: AudioBuffer): number {
  const stride = Math.max(1, Math.floor(audio.sampleRate / 650));
  let squares = 0;
  let count = 0;
  let peak = 0;
  for (let c = 0; c < audio.numberOfChannels; c++) {
    const data = audio.getChannelData(c);
    for (let i = 0; i < data.length; i += stride) {
      const sample = Math.abs(data[i]);
      if (sample > peak) peak = sample;
      if (sample < .014) continue;
      squares += sample * sample;
      count += 1;
    }
  }
  const activeRms = count ? Math.sqrt(squares / count) : 0;
  if (activeRms < .01) return 1.0;
  // Aim for similarly audible syllables across short generated clips.
  // The downstream Web Audio compressor catches transient peaks.
  const rmsGain = .17 / activeRms;
  const peakGuard = peak > 0 ? 1.15 / peak : 2.2;
  return Math.max(.78, Math.min(2.3, rmsGain, peakGuard));
}
