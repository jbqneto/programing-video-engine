# Versioned Animation Presets

Presets are reusable animation recipes with a **small, typed input contract** and immutable, versioned effects. Agents provide only the creative inputs, while the engine supplies timing, easing, layout and transformations.

## First implemented preset: fade-in-entrance

- Identifier: \`fade-in-entrance\`
- Version: \`1.0.0\`
- Type: \`image-transition\`
- Required inputs: \`imageA\`, \`imageB\` (both existing images under \`public/\`)
- Optional \`durationFrames\`: 24–900, default 90
- Fixed effects: image A fades out and scales subtly; image B fades in with a 12-pixel blur decreasing to zero and slight scale change. Both changes use smoothstep easing.

\`\`\`json
{
  "type": "image-transition",
  "id": "scene-03-fade",
  "durationFrames": 90,
  "palette": {
    "background": "#0d1522",
    "accent": "#d8af69",
    "secondary": "#337b8a",
    "text": "#f8edda"
  },
  "presetId": "fade-in-entrance",
  "presetVersion": "1.0.0",
  "inputs": {
    "imageA": "demo/frame-a.svg",
    "imageB": "demo/frame-b.svg"
  }
}
\`\`\`

To create one via MCP:

1. Call \`list_presets\` to discover its contract.
2. Call \`get_project\` and copy \`revision\`.
3. Call \`apply_preset\` with the two image paths and \`expectedRevision\`.
4. The preview automatically reloads the JSON; call \`seek_preview\` to inspect the transition.

Example tool arguments:

\`\`\`json
{
  "presetId": "fade-in-entrance",
  "imageA": "demo/frame-a.svg",
  "imageB": "demo/frame-b.svg",
  "durationFrames": 90,
  "expectedRevision": "<revision returned by get_project>"
}
\`\`\`

## Adding new presets

- Define the input contract and defaults in \`src/presets/registry.ts\`.
- Implement the fixed animation in a frame-deterministic React scene. Avoid \`Date.now\`, \`Math.random\` and animation based on real time.
- Validate inputs in \`src/lib/schema.ts\` and connect the scene in \`src/Video.tsx\`.
- Register the preset in \`list_presets\` and its application logic in the MCP server.
- Add automated tests, a demo, and a dated entry to \`docs/LEARNINGS.md\`.
- **Never silently change an existing preset's animation behavior.** Release a new preset version or identifier, migrate explicitly, and keep old projects reproducible.

Future: introduce a declarative JSON preset DSL with an effects pipeline, so new variations of existing animation operators can be added without editing TypeScript. Do not accept arbitrary JavaScript as agent-supplied preset code.
