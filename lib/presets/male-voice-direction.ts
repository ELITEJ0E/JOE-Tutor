/**
 * Male voice art direction for Gemini Live. These are delivery guidelines for
 * fictional companions; the audio is still synthesized using a prebuilt voice.
 * Do not request a celebrity imitation or rely on precise pitch control.
 */
import type { Agent } from './agents';

const MALE_DELIVERY_BY_ID: Record<string, string> = {
  sam: 'Relaxed, confident, approachable English. Slightly playful dry humor; medium-soft volume and a natural conversational rhythm.',
  tom: 'Grounded but youthful English. Smooth low-mid resonance, steady pace, soft friendly smile in the voice; never booming or elderly.',
  ethan_en: 'Young upbeat English voice, warm and casually confident, light humor, bright but unmistakably masculine. Avoid cartoon-like excitement.',
  joon_ko: 'Youthful, gentle masculine Korean. Smooth clear vowels, understated warmth, an unhurried rhythm; conversational Korean with naturally appropriate politeness.',
  hiro: 'Young soft masculine Japanese. Clear, tender but confident tone with natural Japanese intonation, brief thoughtful pauses and an easy conversational cadence.',
  yuchen_tw: 'Original youthful Taiwanese Mandarin male voice, in the warm low-to-mid register. Sound soft, tender, clear and conversational, with lightly smiling tone, smooth connected phrases, comfortable short pauses and relaxed endings. Use natural Taiwan Mandarin pronunciation, Traditional Chinese vocabulary and idiomatic 台灣華語. Keep the delivery understated and warm, not booming, harsh, robotic or overly formal. Think a considerate young Taiwanese drama character rather than a broadcaster.',
  niran_th: 'Youthful approachable masculine Thai, gentle brightness with relaxed confident resonance. Speak contemporary natural Thai, using polite particles when appropriate.',
  hao_zh: 'Original youthful Mainland Mandarin male voice with gentle low-mid resonance, naturally smooth chest-supported warmth, softly articulated consonants, relaxed vowels and clean natural Mandarin tones. Speak with quiet confidence, slight affectionate warmth, expressive but understated sentence endings, brief meaningful pauses and unhurried conversational cadence. Keep a light airy edge without whispering or breathy distortion. Avoid growling, very deep announcer pitch, pompous recitation, overacting or robotic flatness. Think a polished contemporary Chinese television-drama male lead as a BROAD aesthetic reference, never any identifiable actor voice.',
  rahul: 'Young friendly masculine Hindi/Hinglish; warm, clear and relaxed with natural code-switching when appropriate, avoiding forced slang or caricature.',
  ramon: 'Youthful masculine Spanish voice, relaxed, charming and articulate with authentic everyday phrasing and conversational rhythm.',
  julien_fr: 'Young masculine French speaker, velvet-smooth, warm and unhurried, soft confidence and distinctly natural spoken French.',
  ari: 'Young masculine Hebrew speaker, calm and friendly low-mid register, conversational warmth and natural everyday Israeli Hebrew rhythm.',
  hans: 'Young-to-mid-adult masculine German voice, composed and assured but gentle, articulate without sounding strict or professorial.',
  newton: 'Youthful masculine math enthusiast, clear reassuring explanation cadence, confident but not pompous or stiff.',
  maxim_ru: 'Young masculine Russian, calm, relaxed and even-paced, gently resonant and understated instead of harsh or intimidating.',
  marco_it: 'Young charismatic masculine Italian voice, warm, lively but softly controlled, with natural musical intonation and friendly expressiveness.',
};

export function buildMaleVoiceDirection(agent: Agent): string {
  if (agent.gender !== 'male') return '';
  const detail = MALE_DELIVERY_BY_ID[agent.id] ??
    'Youthful, warm, calmly confident masculine delivery with natural pacing and pleasant resonance.';
  return `\n\n**MALE VOICE & SPEAKING STYLE (APPLY THROUGHOUT VOICE CHAT):**
The speaker is an adult man with a youthful, masculine, natural and friendly voice.
Use a comfortable low-to-mid pitch, smooth resonance, moderate relaxed pace, clear words, subtle expressive inflection, and occasional short pauses.
Do not speak in a high-pitched, overly cute, falsetto, exaggeratedly deep, growling, robotic or theatrical voice.
This voice belongs to an ORIGINAL FICTIONAL companion. Do not imitate or impersonate any real actor or public figure.
Selected character voice direction: ${detail}
These are style preferences, not precise synthesizer pitch/speed controls. The selected voice preset determines the base timbre.
Maintain the companion's chosen language and natural native-language pronunciation.\n`;
}
