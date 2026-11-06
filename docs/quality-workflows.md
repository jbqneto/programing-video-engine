# Local Video Quality Tools

The engine now offers **first-party quality checks** for completed videos. These use the **same exported MP4** created by Remotion, not a competing Canvas renderer. No Scenario account or paid API is involved.

## Requirements

- Node.js 24 or 26 LTS for the project runtime.
- FFmpeg and ffprobe installed on PATH.
- The video must be stored under out/. Inputs are relative to that directory; path traversal and symlink escapes are rejected, including output-directory symlinks before any directory is created. Video limit: 500 MiB, up to 4096x4096 and 18,000 decoded frames.

## Validate an intentionally seamless loop

Render a loop-specific project first. The default Afterhours demo contains a beginning and an ending, so **it is not expected to pass** a seamless-loop test.

Example commands:

    npm run render -- --project src/projects/my-loop.json --out out/loop.mp4
    npm run quality -- loop --input loop.mp4

A result contains a passed boolean, the first/last decoded frame indices, FPS, dimensions, a seam difference, normal start/end frame movement and the acceptance threshold. Any failed check exits the CLI with exit status 1; errors (missing media/FFmpeg) exit with status 2.

The metric is the mean absolute RGB difference after downscaling to 320x180. The last-to-first difference is compared with the mean of the first-to-second and penultimate-to-last movements, allowing a small noise floor. A passing report **does not prove** the motion is a perfect loop: watch two playback cycles and inspect individual frames. Highly localized discontinuities or motion derivatives may be missed by average pixel metrics.

The validator decodes an existing file; it neither generates videos nor changes source projects.

## Generate a contact sheet

    npm run quality -- sheet --input loop.mp4 --out quality/loop-sheet.png --count 9 --columns 3

The output is out/quality/loop-sheet.png. The tool samples frame 0, the last frame and evenly spaced intermediate frames. It prints the exact selected frame indices and seconds, plus output image path. It never overwrites an existing PNG unless --force is passed. Use the frame indices and describe_timeline for precise corrections.

For a preflight of both FFmpeg commands using a tiny locally generated test clip:

    npm run quality:smoke

## MCP tools

- validate_loop(input) — reads a completed video and returns the loop report. No browser tab necessary.
- render_contact_sheet(input, count?, columns?) — generates the PNG under out/quality and returns both the output metadata and an MCP image. Does not depend on a browser tab or trigger a Remotion render.
- list_agent_skills() — discovers upstream and first-party procedural skills. get_agent_skill(skillId) returns only the requested document.

Example agent flow:

    get_project() -> describe_timeline()
    list_agent_skills() -> get_agent_skill("pve-seamless-loops")
    [render actual MP4 via documented CLI]
    render_contact_sheet({input:"loop.mp4",count:9,columns:3})
    validate_loop({input:"loop.mp4"})

The two quality tools operate synchronously on local files with bounded input size, frame count and FFmpeg timeouts. They do not launch paid/cloud generation; they are not a general queue for long-running rendering jobs.

## Provenance and ownership

The mathematical framing and quality-gate ideas were informed by the MIT-licensed [Scenario motion-loop skill](../.agents/skills/scenario-motion-loops/SKILL.md). The actual TypeScript quality implementation here is first-party, not a copy of Scenario's Canvas renderer. Keep vendored Scenario code pinned and unchanged. See [skills overview](scenario-skills.md) and [learning log](LEARNINGS.md).
