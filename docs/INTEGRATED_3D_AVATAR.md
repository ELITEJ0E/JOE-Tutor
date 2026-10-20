# Browser-rendered 3D companion in JOE-Tutor

## What it is

The avatar is now **part of the existing JOE-Tutor interface**, using `components/tutor/TutorAvatar.tsx` and the existing Gemini Live audio level exposed through `volumeRef`. There is no extra `/#mei` page, local FastAPI server, Ollama installation, WebRTC avatar generator, Linux or GPU service.

### Where it appears

- Open your normal JOE-Tutor website.
- The 3D dock appears in the upper-right of the original workspace on desktop; drag its header to move it.
- On narrow screens it starts minimized as **3D Companion**. Expand it to view the animated model.
- **Eco** reduces render resolution and targets 24 FPS; higher quality targets 30 FPS. **Motion** toggles idle head movement.

### Avatar and license

The default 3D character is the CC0 example avatar **`mpfb.glb`** published with [met4citizen/TalkingHead](https://github.com/met4citizen/TalkingHead). It is created with MPFB/Blender and is credited as CC0 by the maintainer. The original file is ~36.8 MB, **not yet an optimized or compact GLB**. Its geometry is animated locally in your visitor's browser by Three.js, using available ARKit-like morph targets for approximate jaw/eye animation. If the external model download fails, an intentionally simplified procedural 3D character renders instead. The procedural character is not photorealistic.

The model is loaded from public GitHub raw hosting rather than bundled in the site's Vercel deployment. External download availability and rate limits are outside this application's control. For a production launch, self-host an optimized GLB under `public/models/` and update `SAMPLE_URL` in `Integrated3DAvatar.tsx`.

### Motion quality

Mouth motion follows the RMS amplitude from the already-playing Gemini Live audio; no speech-analysis server is required. This is **audio-reactive lip motion, not phoneme-accurate lip-sync**. Face shape depends on provided morph targets. A real-time cloud GPU talking-head model would have better realism but is not required for this feature.

## Hosting

Vercel Hobby or another static free tier can serve the React/Vite interface. 3D frame rendering occurs on the **visitor's GPU/CPU**. No Ubuntu or local AI installation is needed. The repo's **existing Gemini Live integration remains unchanged** and requires a valid Google Gemini API key and applicable free-tier quota/terms. Free frontend hosting does not imply unlimited free AI usage.

**Security note:** This repository's existing `vite.config.ts` injects a Gemini key into browser JavaScript. Do not put a sensitive production-secret key in publicly delivered client code. A hardened deployment should use a secure session/ephemeral-token server path with appropriate authentication and rate limits.

## Build locally

```bash
npm ci
npm run lint
npm run build
```

## Limitations and next optimization stage

- The MPFB source model is large (~36.8 MB); model downloads may be slow on mobile data.
- Realistic skin and facial quality are below the neural lip-sync video in the original Reel.
- Target 24/30 FPS is a target rather than guaranteed on Intel Iris Xe.
- A later pass should compress MPFB geometry/textures (Meshopt + WebP) and self-host the optimized GLB, before describing the asset as lightweight.

Source attribution: [TalkingHead README](https://github.com/met4citizen/TalkingHead/blob/main/README.md).