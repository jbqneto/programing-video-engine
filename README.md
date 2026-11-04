# Video Production Engine — MVP 0.1

A declarative prototype for generating 3D videos with **Remotion + Three.js / React Three Fiber**. Projects are JSON files, with scene specifications kept separate from their renderers.

## Requirements

- Node.js >= 22 and npm
- Chromium with WebGL; a GPU is recommended because software rendering can be slow
- FFmpeg for video encoding

## Agent workbench: preview, timeline, presets and MCP

The agent-facing workbench is documented in [Workbench + MCP](docs/workbench.md), [Presets](docs/presets.md), [Agent rules](AGENTS.md) and the incremental [Learning Log](docs/LEARNINGS.md). It borrows selected lessons from the previous [Canvas Animator / FlashMotion Studio](docs/canvas-animator-reuse.md) without importing its separate 2D renderer.

```bash
npm install && npm run workbench
```

Open **http://127.0.0.1:5173** for playback, frame-by-frame scrubbing, timecode and scene inspection. The MCP Streamable HTTP endpoint listens on **http://127.0.0.1:3333/mcp** (localhost-only development access); agents can instead spawn the stdio server via `npm run mcp:stdio`. The browser and agent share a copy of the project at `out/workbench-project.json`, leaving the original sample untouched.

The first versioned, two-input preset is `fade-in-entrance` (images A and B). Agents can discover it with `list_presets`, apply it with `apply_preset` after reading `get_project` revision, update existing scene fields through `update_scene`, and seek the preview with `seek_preview`. Two example SVG assets are included. Current MCP edits work even if the browser tab is closed; the GUI reloads the changed project on its next poll. MP4 rendering remains an explicit CLI step.

Verify both MCP transports: `npm run mcp:check`. Never expose the unauthenticated local HTTP MCP port to a public network.

## Quick start

After installing Node.js 22+ and npm, run:

```bash
npm install && npm run demo
```

This command runs offline checks, validates the sample JSON, type-checks the TypeScript project, and then renders `out/afterhours-demo.mp4`. The rendering itself uses local Chromium/WebGL and may need a supported GPU driver. On Linux, you can try `REMOTION_GL=swangle npm run demo` if the default GL backend fails.

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
scripts/assets.mjs            # Poly Haven / ambientCG CLI
tests/assets.test.mjs        # offline catalog tests
scripts/render.ts            # Remotion render CLI adapter
remotion.config.ts           # WebGL renderer configuration
```

## Free assets catalog

The engine includes a CLI to discover free CC0 models, PBR textures and HDRIs from **Poly Haven** and **ambientCG**:

```bash
npm run assets -- search polyhaven "vintage chair" --type models
npm run assets -- files polyhaven ArmChair_01
npm run assets -- download polyhaven ArmChair_01 --format glb --resolution 1k
npm run assets -- search ambientcg "wood" --type material
```

Poly Haven downloads are stored under `public/assets/polyhaven/` with local provenance metadata and hash verification. **Powered by Poly Haven.** Poly Haven requires visible attribution when its live API is integrated into a product; the assets themselves are CC0. The ambientCG v3 integration currently searches and inspects available download metadata, but does not auto-download. Integration of downloaded GLBs into rendered scenes is a separate milestone.

See [Free 3D asset sources, licenses and CLI](docs/free-assets.md) for the full catalog, licensing precautions, and examples. The public repository does not currently include a code LICENSE file: select one explicitly before accepting external contributions.

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
