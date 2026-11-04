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

## Agent protocol

1. Call \`list_presets\` before rebuilding known effects.
2. Call \`get_project\` to read the current revision and data.
3. Use \`describe_timeline\` to identify exact scene boundaries and FPS (all frames are 0-indexed).
4. Use \`apply_preset\` with a current \`expectedRevision\`. Never overwrite a stale revision. Files must already exist under \`public/\`.
5. Use \`seek_preview\` with \`seconds\` or \`frame\` to direct the connected browser; the MCP itself does not depend on an open tab.
6. Test with \`npm run typecheck\`, \`npm run test\`, and \`npm run mcp:check\` before proposing changes.
8. Append a dated, evidence-based entry to \`docs/LEARNINGS.md\` whenever a reliable new shortcut or failure mode is discovered.
9. If a new animation effect is useful repeatedly, propose/implement a **versioned preset with explicit inputs**, examples, tests, and a documented change history.

## Runtime and dependency rules

- Develop with Node 26 LTS; keep Node 24 LTS green. Reject Node 22, EOL and prerelease runtimes.
- Follow [Runtime and Dependency Policy](docs/dependency-policy.md); research stable releases and the publisher's security advisories before any major upgrades.
- Keep all `remotion` and `@remotion/*` packages pinned to the **same exact version**.
- Keep runtime TypeScript declarations compatible with the oldest supported Node (24), and set `compilerOptions.types=["node"]` for TypeScript 7.
- Generate and commit the npm lockfile after the dependency migration so the CI can use `npm ci`; never auto-accept major upgrades or use `npm audit fix --force`.
- CI must test Node 24 and 26, the UI build, the MCP transports and the offline test suite.
- Review Dependabot PRs weekly; never automatically merge React/Three, MCP protocol or Remotion updates without compatibility checks.

## Rules

- Never use wall-clock time or non-seeded randomness in frame rendering.
- Do not accept arbitrary JavaScript from agent inputs or arbitrary file paths outside the local asset root.
- Do not import the old FlashMotion Canvas renderer: Remotion is the rendering source of truth.
- Do not assume UI preview implies that Chromium MP4 rendering succeeds; validate separately.
- Keep the HTTP MCP on \`127.0.0.1\` by default. Do not expose it publicly without proper auth, TLS, limits and project isolation.
- Never bundle downloaded assets unless their license permits redistribution; preserve provenance.
- Report implemented behavior separately from roadmap plans and unverified claims.

## More information

- [Preset contracts](docs/presets.md)
- [Workbench and MCP usage](docs/workbench.md)
- [Canvas Animator reuse assessment](docs/canvas-animator-reuse.md)
- [Learning log](docs/LEARNINGS.md)
- [Free assets and licenses](docs/free-assets.md)
