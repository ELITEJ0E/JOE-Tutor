# Mei Studio setup

The feature lives at `/#mei` and does not replace JOE Tutor's Gemini voice tutoring.

## Avatar assets
Import your own PNG/JPG/WebP portrait for lightweight idle animation or a facially rigged `.glb` for real 3D animation. The renderer recognizes common morph targets such as `jawOpen`, `mouthOpen`, `viseme_aa`, `eyeBlinkLeft`, `eyeBlinkRight`, and `mouthSmileLeft`. Without these facial blendshapes, a GLB cannot lip-sync. No realistic human GLB is bundled. Uploaded assets remain in the current browser session only.

## Local model and voice
Start your original Mei Browser Avatar FastAPI service on `http://127.0.0.1:7860` with Ollama `qwen2.5:1.5b` and Windows TTS. Mei Studio calls `/api/status`, `/api/chat`, `/api/voice`, and `/api/speak`. It does not replace the existing Gemini client. The Ollama model is configured in the Python backend `.env`, not through the displayed model field.

## Browser permissions and CORS
When you run JOE-Tutor on `http://localhost:3000`, your local FastAPI service must permit that origin. After `app = FastAPI(...)` in your local backend, configure FastAPI CORSMiddleware with explicit allowed origins `http://localhost:3000` and `http://127.0.0.1:3000`, allowing GET and POST and the Content-Type header. Restart the backend. Do not use unrestricted CORS on a local service.

A Vercel-hosted HTTPS page is not guaranteed to connect to an HTTP localhost server because of browser security restrictions. A protected HTTPS bridge or a local development setup is required for a dependable deployment. The new UI does not solve this browser networking restriction.

## Build
`npm install` then `npm run dev`. `package.json` adds `three` and `@types/three`. The GitHub branch needs its package-lock refreshed by running `npm install` and committing `package-lock.json` before any pipeline using `npm ci`.

## Performance
The avatar canvas targets 30 fps and caps pixel density to 1.25. Use optimized GLB assets and compressed textures on Intel Iris Xe. The portrait mode is lower overhead than 3D. There is no AI frame-by-frame generation or phoneme-accurate lip-sync.