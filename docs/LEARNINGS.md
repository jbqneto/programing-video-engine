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

## 2026-11-04 — Curated local production skills from Scenario Labs

- **Context:** [Scenario Labs Skills](https://github.com/scenario-labs/skills), pinned to commit \`e24bc7d40be97b428e7b9fd467c415366e1dd974\`.
- **Observation:** The upstream repository publishes useful local code for deterministic loops, color grading, Blender GLB export, lighting, previs and keyframe animation alongside optional hosted Scenario generation workflows.
- **Rule:** Vendor only the complete skill folders useful to the engine, including referenced local scripts and documents, preserve MIT license/provenance, and never require Scenario cloud for the local MVP.
- **Reusable shortcut:** MCP \`list_agent_skills\` → \`get_agent_skill\`; CLI \`npm run skills -- list\` → \`npm run skills -- show scenario-motion-loops\`.
- **Validation:** \`npm run skills:check\`, unit tests and stdio/HTTP MCP smoke tests verify that local files and documentation are available. This does not test Blender or a rendered video.
- **Known limits:** External Blender/Playwright/Python/FFmpeg prerequisites are optional and not auto-installed; their production workflows are not yet first-party Remotion adapters.


## 2026-11-05 — First-party quality gates around the actual MP4

- **Context:** The curated Scenario motion loop skill provides a tested Canvas 2D loop system, but that system is separate from our Remotion/Three.js renderer.
- **Observation:** We needed agent-callable quality operations on the encoded video that our existing engine creates, rather than a second renderer.
- **Rule:** First render with Remotion. Generate a contact sheet from that MP4. Validate seam differences only for media deliberately designed as seamless loops. Keep first-party workflows in pve-* skills and copied vendor code unchanged.
- **Reusable shortcut:** npm run quality -- sheet --input demo.mp4 --out quality/demo.png, then npm run quality -- loop --input loop.mp4; MCP equivalents render_contact_sheet and validate_loop.
- **Validation:** Pure offline metric tests + an FFmpeg-generated video fixture verify decoding, frame sampling and PNG output in CI. Browser WebGL and complex 3D loop renders still require local verification.
- **Known limits:** Mean RGB seam metrics may miss localized or perceptual glitches. Contact sheets must be examined; they are not an automated artistic quality score.
