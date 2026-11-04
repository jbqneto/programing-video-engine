# Learning Log and Reusable Shortcuts

Use this file to accumulate confirmed findings, repeatable recipes, quality checks and failed attempts. This is not a marketing changelog. It is the agent's durable reference for making each future video faster.

## Entry template

\`\`\`md
### YYYY-MM-DD — Short descriptive title
- **Context:** Which scene, renderer, GPU/browser, output settings?
- **Observation:** What happened? Distinguish verified behavior from speculation.
- **Cause:** Evidence and links to tests, logs, or commits.
- **Rule:** The short rule agents should follow next time.
- **Reusable preset/shortcut:** ID, version, inputs, result. Link to implementation.
- **Validation:** How to verify visually and programmatically.
- **Known limits:** What is still unproven?
\`\`\`

## 2026-11-04 — Keep one source of truth for preview and export

- **Observation:** The old FlashMotion Studio has its own Canvas/mediabunny render pipeline and a browser-window MCP bridge.
- **Rule:** Do not copy that renderer into a Remotion project. Preview the same React composition that is exported by Remotion, using \`@remotion/player\`.
- **Reusable shortcut:** Agent calls \`describe_timeline\` and \`seek_preview({seconds: ...})\` to review exact locations.
- **Validation:** Check the frame positions in browser and compare to an encoded output before claiming pixel parity.
- **Known limits:** MP4 end-to-end and cross-environment visual parity still require testing on a machine with Chromium/WebGL.

## 2026-11-04 — First two-input image transition

- **Observation:** Repeating a two-image transition is easier when fixed effects are encoded once.
- **Rule:** Prefer \`fade-in-entrance\` v1.0.0 to hand-writing opacity, scale and blur for every pair.
- **Reusable shortcut:** \`list_presets\` → \`get_project\` → \`apply_preset(imageA,imageB,expectedRevision)\`.
- **Validation:** Inspect the first frame, middle of the transition, and final frame using the Player.
- **Known limits:** No generalized preset-DSL, interactive parameter editing or contact-sheet renderer yet.

## Backlog of lessons to capture

- Three.js camera movements that remain smooth with exact frame timing
- HDRI/PBR loading and attribution per source asset
- Alpha exports and subtitle/safe-area rules for Shorts
- Long-video memory constraints and deterministic particle behavior
- Motion-graphics cues aligned with narration words or markers

## 2026-11-04 — Supported LTS runtime and coordinated dependency upgrades

- **Context:** The original MVP specified Node >=22 and used broad Remotion ranges, older Vite, Three.js and TypeScript versions.
- **Observation:** Official release policy shows Node 26 as Active LTS and 24 as Maintenance LTS. Remotion explicitly requires every `@remotion/*` package to match `remotion` exactly.
- **Rule:** Develop on Node 26, support Node 24, reject Node 22 and prereleases, and pin identical Remotion versions.
- **Reusable shortcut:** `npm run check:versions` → `npm run typecheck` → `npm run test` → `npm run ui:build` → `npm run mcp:check` → `npm run audit:prod`.
- **Validation:** CI Node 24/26 matrix; browser WebGL and MP4 rendering still require an end-to-end check.
- **Known limits:** Repository did not yet have `package-lock.json`; commit one after confirming the upgrade.
