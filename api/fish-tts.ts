/**
 * Server-side Fish Audio proxy for two Mandarin companions.
 * Configure FISH_AUDIO_API_KEY and authorized per-character voice IDs in Vercel.
 * Never expose the Fish API key or allow callers to supply arbitrary voice IDs.
 */
const voices: Record<string, string | undefined> = {
  mei: process.env.FISH_VOICE_TIAN_XIWEI_ID,
  hao_zh: process.env.FISH_VOICE_ZHANG_LINGHE_ID,
};

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  const character = req.method === 'GET' ? req.query?.character : req.body?.character;
  if (typeof character !== 'string' || !Object.hasOwn(voices, character)) {
    return res.status(400).json({ error: 'Unsupported character' });
  }
  const voiceId = voices[character]?.trim();
  const enabled = Boolean(process.env.FISH_AUDIO_API_KEY && voiceId);
  if (req.method === 'GET') {
    return res.status(200).json({ enabled });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!enabled) return res.status(503).json({ error: 'Fish Audio not configured for this character' });
  const input = req.body?.text;
  if (typeof input !== 'string' || !input.trim() || input.length > 1200) {
    return res.status(400).json({ error: 'Text must be 1-1200 characters' });
  }
  try {
    const upstream = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}`,
        'Content-Type': 'application/json',
        model: 's2.1-pro-free',
      },
      body: JSON.stringify({
        text: input.trim(),
        reference_id: voiceId,
        format: 'mp3',
        temperature: 0.35,
        top_p: 0.65,
        prosody: { speed: 1, volume: 0, normalize_loudness: true },
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!upstream.ok) {
      console.error('Fish Audio synthesis failed:', upstream.status);
      return res.status(502).json({ error: 'Fish Audio synthesis unavailable' });
    }
    // Forward Fish Audio as it arrives instead of waiting for the complete MP3
    // in server memory. Clients using a streaming reader can start sooner.
    if (!upstream.body) return res.status(502).json({ error: 'Empty audio response' });
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200);
    const reader = upstream.body.getReader();
    let totalBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        totalBytes += value.byteLength;
        if (totalBytes > 8_000_000) {
          await reader.cancel();
          res.destroy();
          return;
        }
        res.write(Buffer.from(value));
      }
      return res.end();
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error('Fish Audio proxy error:', error instanceof Error ? error.message : 'unknown');
    return res.status(502).json({ error: 'Fish Audio request failed' });
  }
}
