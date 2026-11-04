# Free 3D Asset Sources

The engine supports local assets under \`public/\`. Asset repositories listed below are external services; their availability, licenses and terms can change.

## Recommended libraries

| Provider | What to find | Automation | License / limitations |
| --- | --- | --- | --- |
| [Poly Haven](https://polyhaven.com/) | HDRIs, PBR textures, 3D models | **Implemented:** search, variants, standalone-file download | Assets CC0. **Live API requires attribution ("Powered by Poly Haven") and an identifying User-Agent.** |
| [ambientCG](https://ambientcg.com/) | PBR materials, HDRIs, some 3D models | **Implemented:** v3 search and download metadata inspection | Assets CC0; public v3 endpoints are read-only. Automatic downloads not yet implemented. |
| [Sketchfab](https://sketchfab.com/features/free-3d-models) | Models, vintage props, architecture | Not implemented | Creative Commons licenses vary; downloading through API requires per-user OAuth 2.0. Preserve model attribution. |
| [Blendkit](https://www.blendkit.com/) | Blender objects, materials, scenes | Not implemented | Free and paid assets; CC0 or royalty-free, depending on asset. |
| [Kenney](https://kenney.nl/assets) | Low-poly model packs | Manual download | Check the specific pack's license. |
| [cgbookcase](https://www.cgbookcase.com/textures) | PBR materials | Manual download | CC0 materials; verify the download page. |
| [Quaternius](https://quaternius.com/) | Stylized models and character packs | Manual download | Verify each pack's license. |

## CLI usage

Node.js 22+ is required. The catalog CLI uses native \`fetch\` and does not require an API key for public Poly Haven or ambientCG data.

\`\`\`bash
npm run assets -- search polyhaven "vintage chair" --type models --limit 10
npm run assets -- search polyhaven "wood" --type textures --limit 10
npm run assets -- search polyhaven "night" --type hdris --limit 10
npm run assets -- files polyhaven ArmChair_01
npm run assets -- download polyhaven ArmChair_01 --format glb --resolution 1k --max-mb 128

npm run assets -- search ambientcg "wood" --type material --limit 10
npm run assets -- files ambientcg Wood096
\`\`\`

Poly Haven downloads go to \`public/assets/polyhaven/<asset-id>/\` and generate a \`.source.json\` provenance file. The directory is ignored by Git. Prefer standalone GLB for Three.js, and HDR/EXR for lighting. A listed variant is not guaranteed to exist for every asset; inspect \`files\` first.

### Download safeguards

- Downloads only use HTTPS and the verified \`dl.polyhaven.org\` host.
- Asset IDs and filenames are validated; path traversal is rejected.
- The default maximum download size is 128 MB. A larger limit requires \`--max-mb\`.
- MD5 is checked when provided by Poly Haven, and partial files are deleted on errors.
- Files with external dependencies are not automatically fetched.
- Downloaded assets are **not automatically inserted into scenes**. The current scene renderers use primitives; local GLB/HDRI scene components are a separate next step.

### Responsible API use

Use an identifying User-Agent and show "Powered by Poly Haven" when using the live Poly Haven API. CC0 assets themselves do not require attribution. Do not rehost or bulk-download third-party catalogs by default; prefer deliberate downloads, local caching, small resolutions, and appropriate rate limiting.

For Sketchfab, do not bypass OAuth, license controls, or attribution requirements. Only import assets explicitly licensed for the intended commercial use.

## Official references

- [Poly Haven API and service terms](https://polyhaven.com/our-api)
- [Poly Haven API source and OpenAPI definition](https://github.com/Poly-Haven/Public-API)
- [ambientCG API v3](https://docs.ambientcg.com/api/v3/)
- [ambientCG assets endpoint](https://docs.ambientcg.com/api/v3/assets/)
- [Sketchfab Download API](https://sketchfab.com/developers/download-api)
- [Blendkit licenses](https://www.blendkit.com/docs/licenses/)
- [Remotion local assets](https://www.remotion.dev/docs/staticfile)

## License for the codebase

The repository currently has **no root LICENSE file**. Its public GitHub visibility alone does not grant permission to redistribute or modify the source code. Before inviting external contributors, the maintainer should choose and add an explicit project license (for example MIT or Apache-2.0) and a contribution policy. Third-party asset licenses remain separate from the engine's code license.
