# Video Production Engine — MVP 0.1

A declarative prototype for generating 3D videos with **Remotion + Three.js / React Three Fiber**. Projects are JSON files, with scene specifications kept separate from their renderers.

## Requirements

- Node.js >= 22 and npm
- Chromium with WebGL; a GPU is recommended because software rendering can be slow
- FFmpeg for video encoding

## Run

```bash
npm install
npm run smoke
npm run validate
npm run studio
npm run render -- --project src/projects/afterhours-demo.json --out out/afterhours-demo.mp4
```

`npm run studio` opens the `CinematicDemo` composition. `npm run render` creates a 1280x720 H.264 MP4 at 30 fps, 9 seconds long with the current sample project. Rendering uses `--gl angle`, which is required for Remotion 4 with Three.js in some environments. On Linux without a GPU, `swangle` may work better.

## Customize

Edit `src/projects/afterhours-demo.json`:

- `width`, `height`, `fps`: output format
- `scenes[]`: sequential scenes with durations in **frames**
- `lounge-3d`: 3D environment, deterministic snowfall, and a slow camera move
- `motion-3d`: metallic 3D rings and typography
- `palette`, `camera`, `snowfall`, `rings`, `title`: per-scene settings
- `audio`: optional audio, for example `"audio": {"src": "audio/music.mp3", "volume": 0.8}`; place the file under `public/audio/`

The render command validates the JSON first. `calculateMetadata()` derives resolution, frame rate, and duration from the project properties. Each frame is determined by the **scene-local frame number** and a **seed**, never by wall-clock time or non-deterministic random values.

## Project structure

```
src/lib/schema.ts            # JSON contract and Zod validation
src/lib/math.ts              # deterministic animation helpers
src/projects/*.json          # projects and settings
src/scenes/Lounge3D.tsx      # stylized environment, snowfall, and camera
src/scenes/Motion3D.tsx      # kinetic 3D objects and titles
src/Video.tsx                # timeline and composition
src/Root.tsx                 # dynamic metadata
scripts/validate.ts          # validation CLI
scripts/render.ts            # Remotion render CLI adapter
remotion.config.ts           # WebGL renderer configuration
```

## Product roadmap

1. Add a `SceneType` and `RenderAdapter` registry (`remotion`, `hyperframes`, `blender`), with separate schemas for effects, cameras, and objects.
2. Cache assets by hash and write a `manifest.json` for each render with its seed, versions, frame rate, and project ID.
3. Add a `POST /render-jobs` API, BullMQ/Redis queue, isolated worker, progress reporting, cancellation, and memory/GPU limits.
4. Render a still or five-second preview before the 1080p or 4K output.
5. Render scenes to intermediate files and compose the final video with FFmpeg, audio tracks, and SRT/VTT subtitles.
6. Sandbox agent input with strict schemas, pre-validated local media, and scene duration and memory limits.

## Current limitations

- This is a **local MVP**, not a render farm or multi-user API.
- The room uses stylized 3D primitives. It is **not photorealistic**; that would require glTF/HDRI assets or Blender scenes with physically based lighting.
- The repository does not include music or third-party models.
- Install npm dependencies on the target machine. This environment did not have the registry dependencies available, so a full end-to-end Remotion render has not been run here.
- Linux server rendering may require WebGL/Chromium adjustments and chunking for long videos.

## References

- https://www.remotion.dev/docs/three
- https://www.remotion.dev/docs/three-canvas
- https://www.remotion.dev/docs/dynamic-metadata
- https://github.com/heygen-com/hyperframes
- https://docs.blender.org/manual/en/4.5/advanced/command_line/index.html

See [docs/architecture.md](docs/architecture.md) for the proposed API, job queue, render interfaces, and isolation policies.
