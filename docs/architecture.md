# Video Production Engine — Evolution Architecture

## Goals and non-goals

**Goal:** describe videos in JSON and render heterogeneous scenes on a deterministic timeline, recording the produced artifacts. **MVP non-goals:** building an editor from scratch, automatically generating photorealistic images from prompts, remote GPU rendering, or executing third-party code.

## Proposed contracts (v0.2, not implemented in this MVP)

`POST /api/render-jobs` accepts `{projectId, engine, preset, priority}` and returns `202 {jobId, status:"queued"}`. A user defines a project in JSON and uploads its assets beforehand.

`GET /api/render-jobs/:id` returns `{jobId,status,progress:{framesDone,framesTotal},startedAt,finishedAt,artifacts:[{kind,path,sha256}]}`. `DELETE /api/render-jobs/:id` requests cancellation.

`POST /api/projects/:id/preview` renders one frame (a thumbnail) or a limited clip at lower compute cost than the final video.

Queue states: `queued -> validating -> preparing -> rendering -> muxing -> done` (or `failed`, `cancelled`). Operations are idempotent by project hash + asset versions + engine version.

## Render adapters

```ts
export type RenderInput = {projectId: string; sceneId: string; fps: number; width: number; height: number; outputDir: string};
export type RenderOutput = {kind: 'mp4' | 'png-sequence'; path: string; frames: number};
export interface RenderAdapter {
  readonly engine: 'remotion' | 'hyperframes' | 'blender';
  validateCapabilities(input: RenderInput): Promise<void>;
  render(input: RenderInput, signal: AbortSignal): Promise<RenderOutput>;
}
```

This contract is a **proposal for a future step**, not implemented code. Per-scene rendering allows tools to be mixed, with final composition through FFmpeg. All renderers should use fixed frame rates and dimensions and produce consistent intermediate files.

## Observability and quality

- Structured logs with `projectId`, `jobId`, `sceneId`, engine version, total time, CPU/GPU usage, peak memory, and exit code.
- `manifest.json` files with parameters, SHA-256 hashes, and seed; each artifact should be reproducible.
- Render a one-to-three-second preview at 480p before 1080p/4K.
- Check that repeated renders of `frame(100)` are consistent.
- Set explicit JSON size limits per job and allowlist types and paths; block unapproved remote URLs and arbitrary scripts from agents.
- Fail fast on missing assets, unsupported schema versions, and unavailable codecs.

## Operating modes

- **Local:** Node.js + Remotion Studio + FFmpeg on the development machine.
- **Worker:** API/queue on a VPS and heavy rendering on a GPU machine when needed.
- **Blender:** export PNG/EXR or H.264 for import into a Remotion/FFmpeg timeline; prefer PNG/EXR when compositing or alpha is needed.
- **HyperFrames:** HTML projects and seekable animations, useful for agent-generated work; adopt after testing fidelity and stability.

## Scene library structure

Scenes are versioned by `type`, `version`, `defaults`, and `schema`: `lounge-3d`, `motion-3d`, `book-opening`, `parallax-2_5d`, `map-route`, `caption-overlay`, and `transition`.

Separating `scene.spec` (data) from `scene.renderer` (code) makes it possible to test presets, switch backends, and automate production without rewriting animations. The current implementation contains only the first two scene types.
