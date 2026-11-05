---
name: pve-seamless-loops
description: Use when creating a seamlessly repeating video, checking the first-to-last-frame seam, or validating deterministic animation.
license: MIT
---

# Seamless Loops — Programming Video Engine

First-party workflow for Remotion/Three.js. The vendored Scenario skill is a reference only.

## Steps

1. Read AGENTS.md. Call get_project and describe_timeline to identify FPS and frame boundaries.
2. Design periodic movement as a pure function of frame/time and seeded parameters. Use phase = (frame % periodFrames) / periodFrames; for nested cycles, each period must divide the loop duration. Scroll patterns must move an integer number of repetitions.
3. Do not use Date.now, Math.random, accumulated deltaTime, unseeded particles or state tied to rendering order.
4. Render a *loop-specific* project with Remotion; the shipped Afterhours demo contains cuts, fades and a finite camera move and **is not a seamless loop**.
5. Run: npm run quality -- loop --input loop.mp4. Or invoke MCP validate_loop with input loop.mp4. Both resolve paths inside out/; neither starts cloud generation.
6. Run: npm run quality -- sheet --input loop.mp4 --out qa/loop-sheet.png. Inspect the first/middle/last stills and watch TWO consecutive playback cycles.
7. Fix discrepancies, rerender, log measurements and any validated shortcut in docs/LEARNINGS.md.

## Interpretation

The last video sample is one frame before the mathematical wrap, so last and first frames need not be identical. The validator compares the seam's mean RGB difference to normal adjacent-frame differences. This is a heuristic, not proof of continuity. A passing pixel score does not replace watching the encoded video. For mathematical guarantees, unit-test value(0) === value(periodFrames) in the underlying deterministic animation function.

The vendored scenario-motion-loops skill has a separate Canvas/Playwright/FFmpeg loop generator; do not substitute its renderer for our Remotion output.
