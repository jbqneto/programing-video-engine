# Runtime and Dependency Policy

This repository is public and agent-driven. Prefer **recent stable versions**, but never update packages solely to make version numbers larger.

## Supported runtime

- **Default for local development:** Node.js **26 LTS** (see `.nvmrc` and `.node-version`).
- **Minimum supported:** Node.js **24 LTS**.
- CI executes the same tests, types, UI build and MCP integration checks on **both 24 and 26**.
- Node 22 and odd-numbered or prerelease Node versions are intentionally excluded.
- The repository's `engines.node` and `.npmrc` reject unsupported runtimes during installation.

## Automated update proposals

Dependabot checks npm and GitHub Actions dependencies every Monday and opens reviewable pull requests. The Remotion family is grouped to keep all patch versions aligned; React/Three.js and MCP dependencies are grouped separately. **Never auto-merge:** each PR must pass the Node 24/26 CI matrix and visual WebGL/MP4 smoke checks if the renderer changed. Review any security advisories separately.

## Direct dependencies as of 2026-11-04

| Technology | Policy |
| --- | --- |
| Remotion, `@remotion/player`, `@remotion/three`, `@remotion/cli` | **Exactly the same stable patch version** (currently `4.0.540`). Never use `^` / `~` for these. |
| Three.js and `@types/three` | Match the tested release family (currently `0.187.0`) and validate with the 3D preview. |
| React / React DOM | Keep a matching stable patch (currently `19.3.1`). |
| React Three Fiber | Latest stable v9 line (currently `^9.8.2`); do not select experimental v10 prereleases. |
| Vite and React plugin | Latest compatible stable lines (currently `^8.3.5`, `^6.2.1`). |
| TypeScript | Latest stable supported release (currently `^7.0.2`). The MCP SDK requires explicit `types: ["node"]` for TS ≥6. |
| MCP SDK | Use stable server/client v2 (`2.4.0`) and Node transport adapter v2 (`2.1.2`), whose version is independent of the SDK. |
| Node types | Follow the **minimum supported Node runtime** (`@types/node@^24.19.2`), to avoid accidental Node 26-only APIs. |

### Change procedure for agents and maintainers

1. Read this policy and the [Learning Log](LEARNINGS.md). Check stable releases and security advisories from the primary publishers.
2. Change related dependency families together (especially Remotion, Three.js and React).
3. Run `npm install` using Node 26. **Commit the resulting `package-lock.json`** in the upgrade PR. (This repository had no lockfile before this migration.) Do not regenerate it on every CI job once committed; switch CI to `npm ci`.
4. Run `npm run check:versions`, `npm run test`, `npm run typecheck`, `npm run ui:build` and `npm run mcp:check`.
5. Validate the workbench visually in Chrome with WebGL and render a full MP4 (the CI currently checks builds and MCP, not video encoding).
6. Run `npm run audit:prod`, inspect high/critical findings and upgrade/resolution behavior. Do not use `npm audit fix --force` blindly.
7. Document updates and observed regressions in `docs/LEARNINGS.md`. Revert or pin a previous stable patch if the new one breaks the render pipeline.

### Why version recency is not sufficient

- A newer **major** may introduce breaking changes that invalidate rendering or the MCP protocol.
- `npm audit` reports known advisories; absence of high/critical reports is not proof that dependencies are vulnerability-free.
- Without a committed lockfile, transitive dependencies can drift between installs. Generating and committing one is an explicit follow-up.
- The Remotion runtime includes a Chromium/WebGL dependency that needs actual video-render tests, not only unit tests.
