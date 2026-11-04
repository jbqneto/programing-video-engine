# FlashMotion Studio / Canvas Animator: Reuse Assessment

Source examined: [jbqneto/canvas-animator](https://github.com/jbqneto/canvas-animator), default branch \`main\`, on 2026-11-04.

## Decision

**Reuse architectural patterns and small, pure algorithms; do not migrate the full UI or its rendering engine.** The FlashMotion editor is already a comprehensive 2D canvas application. Its Canvas renderer and its WebCodecs/mediabunny exporter are not interchangeable with Remotion's React/Three.js timeline.

| Existing Canvas Animator component | Use in this project |
| --- | --- |
| \`src/templates/types.ts\`, \`src/templates/insert.ts\`, \`src/templates/library.ts\` | Adapt the typed preset contract and values-to-scene factory. The first preset lives in \`src/presets/registry.ts\`. |
| \`src/engine/motionPresets.ts\` | Adapt the design: presets expand to reproducible ordinary animation settings. Keep preset version pinned per scene. |
| \`src/engine/keyframes.ts\` | Reference for spring, easing and deterministic interpolation; adapt small pure helpers only when needed. |
| \`src/components/Timeline.tsx\` | Reuse interaction behaviors (scrubbing, markers, frame precision), not the large component implementation. |
| \`mcp/server.ts\`, \`mcp/paths.ts\`, \`mcp/bridge.ts\` | Reuse lessons: explicit tool schemas, revision conflict detection, path allowlists, local-only execution, contact sheets. |
| \`src/automation/protocol.ts\` | Reference for validating agent commands; this engine has its own Zod schema. |
| \`src/utils/exportVideo.ts\`, \`src/components/FlashCanvas.tsx\` | Do not port; maintain one render implementation (Remotion/Three.js) shared by Player and CLI. |
| \`src/project/projectFile.ts\`, autosave | Learn from revision validation and recovery, but use small JSON files instead of the \`.fmproj\` format. |
| \`docs/AUTOMATION.md\`, \`docs/ROADMAP.md\` | Adapt the thoroughness and incremental approach into \`AGENTS.md\`, \`docs/presets.md\` and \`docs/LEARNINGS.md\`. |

## Why the MCP architecture differs

FlashMotion's MCP controls a specific open editor tab using an authenticated local WebSocket bridge. It is well engineered for live browser editing, but its agent API depends on a connected tab. The original FlashMotion motion-framework specification explicitly documents the pain of frozen/restarted browser sessions.

The Programming Video Engine reads and writes the project file directly. Its **MCP works with the browser closed**. The web UI previews the same JSON through the Remotion Player and polls for changes. Remote seek requests are stored in a local preview-state file.

The new workbench supports both **MCP stdio** (launched by a local agent) and **MCP Streamable HTTP**, bound by default to \`127.0.0.1:3333\`. This is an intentionally small initial integration, not a full collaborative editing server.

## Roadmap for selective reuse

1. Add \`update_scene\` with optimistic concurrency and per-field validation, plus UI property editors.
2. Add keyframe/easing curves and reusable motion functions (spring and blurSwap) with frame-exact tests.
3. Add markers, timeline zoom, snapping, undo/redo and local autosave.
4. Add \`render_frame\` and \`render_contact_sheet\` via the same Remotion renderer (no tab dependency).
5. Add a headless render-job queue with progress and cancellation, replacing blocking exports.

Avoid copying the FlashMotion 75 KB Timeline, 60+ KB FlashCanvas and 90+ KB App into the new project: they depend on its actor/content graph, 2D Canvas render pipeline and \`.fmproj\` state.
