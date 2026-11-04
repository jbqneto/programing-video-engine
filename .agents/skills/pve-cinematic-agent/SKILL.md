---
name: pve-cinematic-agent
description: "Use when a programming-video-engine agent must plan or review a cinematic scene, choose a local Blender/loop/color skill, apply a versioned preset, control the browser preview or render a video without relying on paid Scenario generation."
license: MIT
---

# Programming Video Engine — Cinematic Agent

This is a **first-party routing skill**; the seven `scenario-*` skills are vendored reference material and optional local toolkits. The engine's source of truth remains validated JSON and Remotion/Three.js. Read [AGENTS.md](../../../AGENTS.md) and [the skill inventory](../../../docs/scenario-skills.md) first.

## Which workflow?

| Task | Skill to consult | Exit artifact |
| --- | --- | --- |
| Two-image entrance | `src/presets/registry.ts` and `docs/presets.md` | Validated project scene |
| Seamless coded animation | `scenario-motion-loops` | Checked local loop, stills, MP4 |
| Cinematic tone and LUT | `scenario-video-color-grade` | .cube LUT and proof sheet |
| 3D look and camera design | `scenario-blender-previs-storyboard`, `scenario-blender-lighting-rendering` | Shot plan, preview images |
| Prepare 3D model for Three.js | `scenario-blender-expert`, `scenario-blender-export` | Round-trip-validated GLB |
| Rig/object motion | `scenario-blender-animation` | Blender scene and verification renders |

## Mandatory agent workflow

1. Discover existing presets (`list_presets`) and available skills (`list_agent_skills`) before inventing a new effect.
2. Read the relevant skill through `get_agent_skill`, inspect its prerequisites, and avoid cloud-only steps unless explicitly authorized.
3. Use `get_project` to fetch the current SHA revision; change only the requested scene with `apply_preset` or `update_scene`.
4. Seek the timeline to the relevant seconds with `describe_timeline` and `seek_preview`.
5. Review first/middle/last frames, plus loop seam frames if applicable. The local browser preview is not proof of MP4 export success.
6. Render only after review; verify actual output duration, FPS, dimensions and audio with `ffprobe` where available.
7. Record new, measured shortcuts in `docs/LEARNINGS.md`; version reusable effects and don't overwrite vendor instructions.

Never execute remote API calls, launch Blender scripts with file-writing effects, or overwrite assets without inspecting and confirming scope. `get_agent_skill` is read-only.
