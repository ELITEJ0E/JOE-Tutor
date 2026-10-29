/**
 * Netlify version of /api/fish-tts. Vercel's /api directory is NOT deployed
 * as Netlify Functions, so a Netlify deployment needs its own server route.
 *
 * Keep FISH_AUDIO_API_KEY and the authorized voice reference IDs in Netlify's
 * server-side environment variables. Never expose them through Vite defines.
 */
const characters = new Set(['tian_xi_wei', 'hao_zh', 'ju_jingyi', 'karina_aespa']);

const noStore = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...noStore, 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

function referenceIdFor(character) {
  const configured = {
    tian_xi_wei: process.env.FISH_VOICE_TIAN_XIWEI_ID,
    hao_zh: process.env.FISH_VOICE_ZHANG_LINGHE_ID,
    ju_jingyi: process.env.FISH_VOICE_JU_JINGYI_ID,
    karina_aespa: process.env.FISH_VOICE_KARINA_AESPA_ID,
  };
  return configured[character]?.trim();
}

export default async function handler(request) {
  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' });
  }

  let character;
  let text;
  if (method === 'GET') {
    character = new URL(request.url).searchParams.get('character');
  } else {
    // Don't buffer arbitrarily large user requests.
    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (declaredLength > 8192) return json({ error: 'Request too large' }, 413);
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }
    character = body?.character;
    text = body?.text;
  }

  // Never accept a caller-supplied Fish reference_id or an arbitrary voice.
  if (typeof character !== 'string' || !characters.has(character)) {
    return json({ error: 'Unsupported character' }, 400);
  }
  const referenceId = referenceIdFor(character);
  const apiKey = process.env.FISH_AUDIO_API_KEY?.trim();
  const enabled = Boolean(apiKey && referenceId);

  // This is the preflight that JOE Tutor uses before every Mandarin session.
  if (method === 'GET') return json({ enabled });

  if (!enabled) {
    return json({ error: 'Fish Audio not configured for this character' }, 503);
  }
  if (typeof text !== 'string' || !text.trim() || text.length > 1200) {
    return json({ error: 'Text must be 1-1200 characters' }, 400);
  }

  try {
    const upstream = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        model: 's2.1-pro-free',
      },
      body: JSON.stringify({
        text: text.trim(),
        reference_id: referenceId,
        format: 'mp3',
      }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(25000)]),
    });

    if (!upstream.ok) {
      console.error('Fish Audio Netlify proxy upstream error:', upstream.status);
      return json({ error: 'Fish Audio synthesis unavailable' }, 502);
    }
    if (!upstream.body) {
      return json({ error: 'Empty audio response' }, 502);
    }

    // Return the upstream MP3 as a real streamed Response. Netlify can pass
    // these bytes to the browser without waiting to buffer the whole clip.
    let bytes = 0;
    const limited = upstream.body.pipeThrough(new TransformStream({
      transform(chunk, controller) {
        bytes += chunk.byteLength;
        if (bytes > 8_000_000) {
          throw new Error('Fish Audio response exceeded 8 MB');
        }
        controller.enqueue(chunk);
      },
    }));
    return new Response(limited, {
      status: 200,
      headers: {
        ...noStore,
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Fish Audio Netlify proxy failed:', error instanceof Error ? error.message : 'unknown');
    return json({ error: 'Fish Audio request failed' }, 502);
  }
}
