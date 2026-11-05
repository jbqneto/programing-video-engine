# AGENTS.md — Programming Video Engine

All code, UI labels, documentation, preset IDs, tool descriptions and commit messages **must be written in English**. This public repository is independent of any creator's private YouTube channels, local drives or credentials.

## Mission

Build reproducible 2D/3D videos from validated JSON. Support an agent-first workflow: discover reusable presets, inspect and edit project data, preview exact frames, then render through Remotion.

## Architecture

- \`src/lib/schema.ts\`: validated project and scene contract (Zod).
- \`src/presets/registry.ts\`: public, versioned preset catalog and factory.
- \`src/scenes/\`: deterministic React/Three.js scene renderers.
- \`src/Video.tsx\`: the same Remotion composition for browser preview and final render.
- \`scripts/mcp/\`: stateless project operations exposed by stdio and local Streamable HTTP.
- \`studio/\`: light browser UI using \`@remotion/player\`.
- \`src/projects/\`: versioned JSON examples. Agent edits are saved by default to \`out/workbench-project.json\`.
- \`docs/LEARNINGS.md\`: incremental log of verified shortcuts, experiments and limitations.

## Agent skills

Use `list_agent_skills` (MCP), `npm run skills -- list`, or `.agents/skills/catalog.json` to discover optional skills. Use `get_agent_skill` for the relevant skill's instructions and inspect its referenced scripts. **Never load all seven skills into an agent prompt at once**. Vendored skill texts sometimes describe optional, paid Scenario cloud calls; only local workflow steps are allowed by default. Explicit authorization is required for paid/cloud operations, unexpected file writes or executing Python in a live Blender session. Do not edit vendor files to record internal learnings; update `docs/LEARNINGS.md` and our own versioned presets instead.

## First-party production and quality workflows

Our first-party skills are pve-seamless-loops, pve-motion-presets and pve-visual-review in .agents/skills/. These encode reusable procedures; the existing vendored Scenario skill folders are third-party documentation/tools, not dependencies of the Remotion renderer.

For a complete video: discover the applicable skill, build or update the validated project, preview precise frames, render MP4, run quality: sheet to inspect a contact sheet, and (only for intended loops) run quality: loop to evaluate the encoded seam. CLI QA input/output paths are relative to out/. MCP tools validate_loop and render_contact_sheet work without an open browser, require locally installed FFmpeg/ffprobe and never invoke Scenario cloud.

## Supported runtime

Develop with Node 26 LTS, support Node 24 LTS, and use recent stable packages. Keep Remotion package versions pinned to an identical patch. Never merge a dependency update without the Node 24/26 CI matrix, MCP checks and a visual render verification where relevant. See docs/dependency-policy.md.

## Agent protocol

1. Call \`list_presets\` before rebuilding known effects.
2. Call \`get_project\` to read the current revision and data.
3. Use \`describe_timeline\` to identify exact scene boundaries and FPS (all frames are 0-indexed).
4. Use \`apply_preset\` with a current \`expectedRevision\`. Never overwrite a stale revision. Files must already exist under \`public/\`.
5. Use \`seek_preview\` with \`seconds\` or \`frame\` to direct the connected browser; the MCP itself does not depend on an open tab.
6. When reviewing a completed MP4, use render_contact_sheet; use validate_loop only when the media is intended to loop.
7. Test with \`npm run typecheck\`, \`npm run test\`, and \`npm run mcp:check\` before proposing changes.
8. Append a dated, evidence-based entry to \`docs/LEARNINGS.md\` whenever a reliable new shortcut or failure mode is discovered.
9. If a new animation effect is useful repeatedly, propose/implement a **versioned preset with explicit inputs**, examples, tests, and a documented change history.

## Rules

- Never use wall-clock time or non-seeded randomness in frame rendering.
- Do not accept arbitrary JavaScript from agent inputs or arbitrary file paths outside the local asset root.
- Do not import the old FlashMotion Canvas renderer: Remotion is the rendering source of truth.
- Do not assume UI preview implies that Chromium MP4 rendering succeeds; validate separately.
- Keep the HTTP MCP on \`127.0.0.1\` by default. Do not expose it publicly without proper auth, TLS, limits and project isolation.
- Never bundle downloaded assets unless their license permits redistribution; preserve provenance.
- Report implemented behavior separately from roadmap plans and unverified claims.

## More information

- [Quality workflows](docs/quality-workflows.md)
- [Preset contracts](docs/presets.md)
- [Workbench and MCP usage](docs/workbench.md)
- [Canvas Animator reuse assessment](docs/canvas-animator-reuse.md)
- [Learning log](docs/LEARNINGS.md)
- [Free assets and licenses](docs/free-assets.md)
