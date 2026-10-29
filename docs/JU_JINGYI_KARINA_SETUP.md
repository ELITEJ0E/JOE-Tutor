# Ju Jingyi and Karina companion setup

Both new companions are available in JOE Tutor without extra configuration:

- **Karina (Korean)** follows Yuna in the female character menu.
- **鞠婧祎 (Chinese)** follows Tian Xiwei / 田曦薇.

Their profile prompts are fictional interpretations based on publicly available interviews, not claims of contact or endorsement by the real performers.

## Replace the thumbnail portraits

No thumbnail is currently assigned to these two characters. Upload the images when ready; no SVG placeholder is used.

1. Upload approved photos into the directory: src/assets/images/avatars/
2. In lib/presets/agents.ts, import your uploaded image files and assign them to the new agents' avatarUrl fields.
3. In lib/characters/character-registry.ts, import the same images and set each agent's avatar.portrait.
4. Commit the photos and changes; deploy the new version.

PNG, JPG, or WebP all work. Portraits roughly 4:5 work well, with the face near the center so the round selection thumbnail does not crop it awkwardly.

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
