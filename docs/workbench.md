# Agent Workbench and MCP

This MVP uses Remotion both in the browser (\`@remotion/player\`) and for CLI video rendering. The workbench UI is intentionally small: play/pause, exact seek by frame or seconds, a scene timeline, a JSON inspector and a preset catalog.

## Start

Requirements: Node.js 24 or 26 LTS, npm; for visual 3D preview, a browser with WebGL.

\`\`\`bash
npm install
npm run workbench
\`\`\`

- UI: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- MCP (Streamable HTTP, local only): \`http://127.0.0.1:3333/mcp\`
- Health check: \`curl http://127.0.0.1:3333/health\`
- Stdio MCP (alternative for a local coding agent): \`npm run mcp:stdio\`

\`npm run workbench\` starts a Vite dev server and the HTTP MCP service. Both use \`out/workbench-project.json\`, created once from \`src/projects/afterhours-demo.json\`; edits persist on restart and the original demo remains unchanged. The browser polls for project revisions approximately every 1.5 seconds and remote seek requests every 0.6 seconds.

The port \`3333\` is for HTTP MCP; the HTTP endpoint is **not** the same as the browser UI port \`5173\`. HTTP MCP does not require an open tab. \`seek_preview\` will become visible once a workbench browser tab is open. For supported clients, register either the HTTP URL or the stdio command.

### MCP tools

| Tool | Purpose |
| --- | --- |
| \`get_project\` | Read validated JSON, SHA-256 revision, duration and workspace file path |
| \`describe_timeline\` | Show scene boundaries in frames and seconds |
| \`list_presets\` | Discover input contract, effects, versions and examples |
| \`apply_preset\` | Append a parametrized scene; requires \`expectedRevision\` |
| \`seek_preview\` | Ask an open browser to pause and seek to an exact frame/second |
| \`get_preview_state\` | Read the last requested preview seek |
| \`get_agent_guide\` | Read repository rules from \`AGENTS.md\` |

### Agent workflow

\`\`\`text
list_presets()
get_project()                # copy revision
apply_preset({
  presetId: "fade-in-entrance",
  imageA: "demo/frame-a.svg",
  imageB: "demo/frame-b.svg",
  durationFrames: 90,
  expectedRevision: "<revision from get_project>"
})
describe_timeline()          # identify position of the new scene
seek_preview({seconds: 9.5}) # open UI seeks to the requested moment
\`\`\`

Both example images ship under \`public/demo/\`. To insert different pictures, put them under \`public/\` first. The app prevents traversal and resolves real paths before accepting images, including symlinks.

### Edit an existing scene at a precise time

Call `describe_timeline` to map the requested minute/second to a scene ID. Call `get_project` for its current values and revision, then `update_scene` with an allowlisted partial patch:

```json
{
  "sceneId": "scene-02-motion-graphics",
  "expectedRevision": "<latest get_project revision>",
  "patch": {"title": "A NEW TITLE", "rings": 4}
}
```

Allowed fields: `lounge-3d` supports title, camera, snowfall, palette, durationFrames; `motion-3d` supports title, subtitle, rings, palette, durationFrames; `image-transition` supports inputs, palette, durationFrames. Changing `durationFrames` shifts subsequent scene boundaries. Structural changes still require a new preset or explicit code edits. UI property editing and timeline keyframe editing are future milestones.

### Review the exported video through MCP

After rendering the validated project to an MP4 in out/, call render_contact_sheet with input set to the MP4 filename and an optional count/columns. The MCP returns a real PNG image plus selected frame/time metadata. For deliberately seamless loops, call validate_loop on the same file to get a first/last seam report (not a visual quality guarantee). These tools need FFmpeg and ffprobe; details are in docs/quality-workflows.md.

### Render the current edited project

\`\`\`bash
npm run render -- --project out/workbench-project.json --out out/workbench-render.mp4
\`\`\`

The CLI uses the same validated JSON contract as the Player. Rendering is not triggered automatically by MCP in this milestone, and the rendered MP4 is not yet returned as an MCP artifact. To test the MCP endpoints and handshake without rendering:

\`\`\`bash
npm run mcp:check
\`\`\`

### Security and limitations

- HTTP is bound to \`127.0.0.1:3333\`, with localhost Host and allowed Origin checks. It is **not authenticated** in this local prototype: any local process may connect. Do not expose or forward port 3333 to untrusted networks, a VPS or a public domain.
- All MCP operations work on the single local workbench project and use optimistic revision checks for edits.
- The preview synchronizes project changes and agent-triggered seeks. This is not a multi-user editing server with undo history or fine-grained collaboration.
- The preview is a live WebGL view, but encoder differences can affect final MP4 quality. Validate an actual video render before publication.
- Presets are currently implemented in TypeScript. A safe, declarative JSON preset DSL and UI-based preset authoring are proposed follow-ups.
