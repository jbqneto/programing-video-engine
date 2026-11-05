# Curated Scenario Labs Agent Skills

This directory contains **seven unmodified, vendored skills** from [Scenario Labs Skills](https://github.com/scenario-labs/skills), pinned to commit `e24bc7d40be97b428e7b9fd467c415366e1dd974` (2026-11-04 review). Every skill includes its original `SKILL.md`, reference documents and local scripts. The original texts and scripts are intentionally kept intact to simplify license compliance and future upstream comparisons.

## Why these seven

| Skill | Application in Programming Video Engine | Local prerequisites |
| --- | --- | --- |
| [Motion Loops](../.agents/skills/scenario-motion-loops/SKILL.md) | Build/test seamless motion backgrounds; extract deterministic loop-verification ideas for Remotion | FFmpeg, Node.js, optional Playwright |
| [Video Color Grade](../.agents/skills/scenario-video-color-grade/SKILL.md) | Generate .cube LUTs and proof stills for cinematic videos | FFmpeg, Python, numpy, scipy, Pillow |
| [Blender Expert](../.agents/skills/scenario-blender-expert/SKILL.md) | Audit meshes and produce viewport/review reports | Optional Blender/bpy |
| [Blender Export](../.agents/skills/scenario-blender-export/SKILL.md) | Prepare GLB/glTF assets and verify import fidelity for Three.js | Optional Blender/bpy |
| [Blender Lighting & Rendering](../.agents/skills/scenario-blender-lighting-rendering/SKILL.md) | Reusable lighting, HDRI, Cycles/EEVEE and scene-quality checks | Optional Blender/bpy |
| [Blender Previs & Storyboard](../.agents/skills/scenario-blender-previs-storyboard/SKILL.md) | Build shot lists, framing previews, camera planning and animatics | Optional Blender/bpy |
| [Blender Animation](../.agents/skills/scenario-blender-animation/SKILL.md) | Agent-assisted keyframe animation and deterministic motion evaluation | Optional Blender/bpy |

## First-party companion skills and quality tools

The engine also ships three independently authored skills: pve-seamless-loops, pve-motion-presets and pve-visual-review. They are inventoried separately in .agents/skills/first-party-catalog.json, and they appear in npm run skills -- list and MCP list_agent_skills. The first-party skills refer to the curated Scenario procedures when useful, but direct the agent to our own Remotion pipeline, not Scenario's independent Canvas renderer.

The first-party quality implementation lives in scripts/quality/: validate the seam of a completed MP4 and generate an evenly sampled contact sheet of an encoded video through local FFmpeg. Details: [quality workflows](quality-workflows.md).

## What is actually integrated

- All 47 upstream files for these seven skills have been **vendored** under `.agents/skills/<name>/`, without editing the upstream implementations.
- `.agents/skills/catalog.json` provides a machine-readable inventory, origins and prerequisites.
- Agents can read the repository index, and MCP clients can call `list_agent_skills` / `get_agent_skill` to discover a relevant instruction document.
- The existing video renderer **remains Remotion + Three.js**. No Scenario-hosted generation, Blender invocation or vendor script is started merely by running `npm run workbench`.
- The local optional scripts are included **as reference capabilities**, not yet integrated as production rendering adapters or MCP execution tools.

## Local use

### Motion loop

Requires `ffmpeg`, `ffprobe` and a browser accessible through Playwright. Install Playwright/Chromium separately in your optional tools environment, then:

```bash
node .agents/skills/scenario-motion-loops/scripts/render-loop.mjs --help
node .agents/skills/scenario-motion-loops/scripts/render-loop.mjs \
  .agents/skills/scenario-motion-loops/scripts/loop-template.html --check --channel chrome
```

The second command requires an installed Google Chrome browser; drop `--channel chrome` when using Playwright's Chromium. This check belongs to the **upstream Canvas 2D loop**. It does not, by itself, test Remotion WebGL loops.

### Color grading

Use a separate Python environment to avoid impacting the engine's Node dependencies:

```bash
python3 -m venv .venv-video-grade
. .venv-video-grade/bin/activate
python -m pip install numpy scipy Pillow
python .agents/skills/scenario-video-color-grade/scripts/grade.py \
  .agents/skills/scenario-video-color-grade/examples/looks.json \
  out/luts
```

This example creates local LUT files; it does not invoke Scenario's hosted models.

### Blender

Use your installed Blender executable with the script modules located under `.agents/skills/scenario-blender-*/scripts/`. The upstream Blender scripts were documented/tested against Blender 5.2.1; **check the installed Blender version and API compatibility before executing them**. They are not Node dependencies. Start with `scenario-blender-expert`; domain skills often depend on its modules.

## Agent selection protocol

1. Check `AGENTS.md`, then `list_agent_skills` or `.agents/skills/catalog.json`.
2. Read only the selected `SKILL.md` and referenced supporting files; do not load every skill into context.
3. For built-in Remotion scenes, use `get_project`, `list_presets`, `apply_preset`, `update_scene` and the normal render CLI.
4. For external Blender/LUT/Canvas tasks, inspect the script, versions, prerequisites, inputs, output path and possible side effects first. Never run arbitrary Python in a user's live Blender session without approval.
5. Separate free, **local** procedures from optional Scenario cloud steps. Do not make an outbound call or incur credits without authorization.
6. When a new technique proves useful in multiple projects, extract it into our own **versioned preset** or our own `pve-*` skill. Log evidence in `docs/LEARNINGS.md`; do not mutate copied vendor sources.

## Provenance, licensing and updates

The upstream repository is MIT licensed. See [the preserved license](../.agents/skills/SCENARIO-LICENSE.txt) and the [upstream source](https://github.com/scenario-labs/skills). Copyright (c) 2026 Scenario Inc. The upstream license applies to the copied files; it does **not** license the rest of this repository, which still requires an independently chosen license.

The skills may reference other Scenario skills or remote services that are not included in this curated collection. This is intentional, not a promise that every cloud workflow runs offline. We excluded hosted-generation-only skills, large game-engine-specific pipelines and scripts that would add mandatory cloud or paid dependencies to the base MVP.

To update: inspect upstream changes, licenses and prerequisites at a **specific commit**; update the complete skill folder and `catalog.json` together, then run `npm run skills:check` and optional tool-specific tests. Do not silently pull latest at runtime.
