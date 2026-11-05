---
name: pve-visual-review
description: Use when reviewing a video through contact sheets, evaluating individual frames, checking output properties, and documenting exact timecode issues.
license: MIT
---

# Visual Review — Programming Video Engine

## Workflow

1. Read describe_timeline (or the validated project JSON) and confirm FPS, resolution and scene IDs.
2. Inspect intended frames in Remotion Player, then create an MP4 with the normal Remotion render CLI.
3. Run npm run quality -- sheet --input video.mp4 --out qa/video-sheet.png --count 9 --columns 3, or MCP render_contact_sheet with identical options. Video filenames are relative to out/.
4. **Open and inspect the generated PNG**. Evaluate framing, text readability, black frames, lighting continuity, camera movement, transitions and visual hierarchy. Sample additional moments around any defect.
5. For intentional loops, run validate_loop and watch two cycles. For ordinary videos, a hard cut at the end may be intentional: do not mistake it for a broken loop.
6. Report issues as seconds = frame / fps and the corresponding sceneId. Use revision-checked update_scene, then rerender and compare.
7. Record repeatable observations, evidence and limitations in docs/LEARNINGS.md; promote reusable visual solutions into versioned presets.

## Rubric

Composition, movement and easing, typography, temporal continuity, technical correctness (resolution/FPS/audio) and intentional loop seams. Contact sheets are **samples**, not proof of overall video quality; a generated sheet still requires human or multimodal visual review. No Scenario account or cloud credits are required.
