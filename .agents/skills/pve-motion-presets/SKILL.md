---
name: pve-motion-presets
description: Use when discovering, applying, evolving, testing or documenting a reusable versioned motion animation preset.
license: MIT
---

# Versioned Motion Presets — Programming Video Engine

## Agent workflow

1. Read AGENTS.md and docs/presets.md. Call list_presets before inventing a new effect.
2. Call get_project to capture a SHA-256 revision, then describe_timeline to locate scenes in 0-based frames.
3. Use apply_preset with the preset identifier, its small input schema and the latest expectedRevision. The existing fade-in-entrance@1.0.0 uses imageA and imageB; timing, blur, scale and easing are fixed in code.
4. Inspect start, middle and final frames via seek_preview; only change allowed scene fields through update_scene.
5. Export the video and run the quality contact-sheet workflow before treating it as production-ready.

## Adding a new preset

- Define a typed input contract and defaults in src/presets/registry.ts.
- Add a frame-deterministic renderer under src/scenes; validate the scene in src/lib/schema.ts and route it through src/Video.tsx.
- Extend MCP discovery/application, create sample media, and test invalid paths, input limits and boundary frames.
- Version behavior with presetVersion; never silently change old preset animation timing or rendering semantics.
- Capture measured improvements in docs/LEARNINGS.md after repeated use.

Skill = procedure; preset = reusable animation recipe; MCP = execution; Remotion = renderer. Never run agent-provided JavaScript, mutate vendored Scenario code, or require cloud APIs.
