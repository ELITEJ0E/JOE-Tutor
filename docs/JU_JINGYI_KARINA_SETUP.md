# Ju Jingyi and Karina companion setup

Both new companions are available in JOE Tutor without extra configuration:

- **Karina (Korean)** follows Yuna in the female character menu.
- **鞠婧祎 (Chinese)** follows Tian Xiwei / 田曦薇.

Their profile prompts are fictional interpretations based on publicly available interviews, not claims of contact or endorsement by the real performers.

## Uploaded transparent portraits

The user-provided PNGs are connected to both agent avatars and profile thumbnails; no SVG placeholders are used.

- Ju Jingyi: `src/assets/images/avatars/Ju_Jingyi_transparent_avatar.png`
- Karina: `src/assets/images/avatars/Karina_transparent_avatar.png`

Both image imports are used in `lib/presets/agents.ts` and `lib/characters/character-registry.ts`.
To replace these portraits later, overwrite the corresponding PNG while preserving the same filename.

## Configure voice IDs later

The profiles currently speak using the app's **generic Gemini Leda voice** when no Fish Audio ID is set. The following variables activate separate Fish Audio voices:

| Environment variable | Purpose |
| --- | --- |
| FISH_AUDIO_API_KEY | Existing server-side Fish Audio API credential |
| FISH_VOICE_JU_JINGYI_ID | Authorized voice reference ID for 鞠婧祎 |
| FISH_VOICE_KARINA_AESPA_ID | Authorized voice reference ID for Karina |

In Vercel: **Project → Settings → Environment Variables → Production**. Add the respective values and redeploy. Do not use VITE_-prefixed copies or commit real secrets. Model IDs intentionally remain blank in .env.example.

The code also supports equivalent Netlify settings. Fish Audio catalog search results alone do not establish rights to use celebrity voice likenesses: use only a model and recordings for which you have the necessary authorization.

## Smoke tests

1. Open the female character selector and confirm both positions.
2. Choose either character and verify its own welcome message, portrait, and appropriate Korean/Mandarin prompt.
3. Without new Fish environment variables, confirm each can still speak through the generic Gemini fallback.
4. Once the Fish IDs have been configured, confirm the GET preflight at /api/fish-tts?character=ju_jingyi and /api/fish-tts?character=karina_aespa returns enabled true.
5. Recheck Tian Xiwei and Zhang Linghe to ensure their existing Fish-only behavior is unchanged.

Local verification commands: node scripts/check-voice-presets.mjs, npm run lint, npm run build.
