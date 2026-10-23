# CourseGraph demo media

**Deferred:** Stephen paused remaining media work on October 23, 2026. This is preparation for a future resumption, not an active capture/render assignment. Existing images span intermediate builds. See [TODO.md](../TODO.md).

The films are captioned motion presentations made from actual current prototype screenshots. They do not imply continuous mouse interaction. No generated application screens, simulated clicks, paid media, voiceover, or music are used. Final rendering waits for the root agent’s explicit captures-ready handoff.

## Final capture set

Refresh these six files in `docs/media/` from the same frozen build. The renderer reads only these six names and ignores older QA shots. Use a consistent 1280×720 viewport or larger, preferably 1600×900 or 1920×1080 when practical. JPEG is preferred; PNG is accepted. The minimum is 1000×500. Record the build identifier and approved filenames at handoff.

| File | Required content |
| --- | --- |
| `overview.jpg` | A clear left-to-right map orientation, MIT catalog identity, and the large program-goal crest if it fits. Use the real zoom controls when needed; Reset view now uses 0.575 zoom. No fabricated overview. |
| `prerequisites.jpg` | A readable focused course with cyan incoming prerequisites and violet onward possibilities, plus the compact course preview where useful. |
| `missing.jpg` | A real missing-prerequisite state: the course, amber/red relationship and warning text visible together. |
| `resolved.jpg` | The same course, path and framing after a valid earlier-term prerequisite has been planned. Preserve comparable zoom and panning so the change is visually clear. |
| `paths.jpg` | Expanded saved paths with multiple actual named alternatives, the persistent rail, and local-browser save context. No unimplemented side-by-side comparison. |
| `timeline.jpg` | The actual semester plan with course loads and honest schedule-unverified language. |

At least three distinct approved states are required to render; all six are the intended final set. Screenshots are fitted proportionally with no distortion or cropped warnings. The manifest stores source dimensions, SHA-256 fingerprints, captured build, scene order, durations, public URL, and measured render time.

Before capture, dismiss unrelated toasts and dialogs, wait for fonts and movement to settle, and keep source labels readable. Keep browser secrets, unrelated tabs and personal account information out of the frame. The visible Stephen profile is a local prototype placeholder, not evidence of authentication.

## 52-second school explainer

The value proposition is a clearer starting point for student exploration and advisor conversations. The film shows actual choices and uncertainties; it does not claim a certified degree audit, guaranteed admission, institutional adoption, SIS integration, real-time schedules, or cross-school catalog coverage.

| Time | Actual visual | Caption direction |
| --- | --- | --- |
| 0–5 s | Designed title card with a small actual overview | A clearer way to see your future. |
| 5–10.5 s | Course map and program goal | See where your foundations can lead. |
| 10.5–17.5 s | Focused prerequisites and onward possibilities | See the steps behind the next step. |
| 17.5–24.5 s | Missing requirement and warning | Make a missing step visible. |
| 24.5–32 s | The verified earlier-term repair | Turn a missing step into a plan. |
| 32–39 s | Named saved alternatives | Compare possible futures. |
| 39–46 s | Semester planning and scheduling uncertainty | Bring possibilities into a semester plan. |
| 46–52 s | Designed closing card and coursegraph.my | Keep more than one future. |

If an approved state is absent, the screenshot portion is normalized to 41 seconds; the complete film remains 52 seconds. Warm neutral presentation surfaces, ink-blue typography, controlled cyan/violet/amber accents, 0.3-second dissolves and a very small presentation push-in keep attention on the app. The app image fills most of the frame, and captions stay outside it.

## 10.8-second README loop

Four 2.7-second beats: **See what opens next → Spot the missing step → Connect the next step → Keep another future.** Use prerequisites, missing, resolved and paths in that order. Hold each screenshot steady for legibility, with short crossfades between them. The loop shows a manual planning repair, never an invented click or a continuously recorded interaction.

Deliver a 1920×1080 MP4 at 30 fps, a 1200 px wide GIF at 15 fps, a poster PNG, and WebVTT captions. The GIF is silent and loops continuously. The MP4 provides the higher-quality version; GitHub Markdown is not assumed to autoplay it. If a required repair image is unavailable, omit the repair claim and use only approved states, keeping the total at 10.8 seconds.

Every screenshot scene identifies local-browser saving, no sign-in, partial MIT data, and no degree certification. The explainer’s closing card repeats the local persistence and scope limits. A checked course means a planned choice or recorded history as labeled; it does not establish enrollment. A 100% mapped-coursework bar does not establish degree completion, and a user-recorded advisor review is not MIT verification.

## Manual-repair capture candidate

Use a copied illustrative path to preserve the original. The existing example plans **6.1010 Fundamentals of Programming** in **Spring 2027** and marks **6.100A** completed. The imported prerequisite expression is **6.1000 OR (6.100A AND (6.100B OR 16.C20))**.

1. Inspect 6.1010 through Course list or another inspect-only detail link and capture its missing-requirement state. Clicking an already-planned graph card toggles its membership, so do not use that action merely to inspect it.
2. Inspect 6.100B, choose Fall 2026, and add it to the copied path if the current UI confirms its modeled requirements are met.
3. Inspect 6.1010 again and verify the changed requirement result before capturing `resolved.jpg` at the same framing as `missing.jpg`.

The example establishes a hypothetical valid order, not completed credit. The snapshot lists 6.100B for Fall/Spring and accepts 6.100A or instructor permission. Keep unused OR alternatives visibly optional and preserve any remaining uncertainty. If the current UI does not support this example, select another verified course pair rather than manufacturing the desired result.

## Runtime and commands

Installed runtime:

- Python: `/Users/eeveehome/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3`
- Pillow 12.3.0
- FFmpeg and ffprobe: `/opt/homebrew/bin/ffmpeg`, `/opt/homebrew/bin/ffprobe` (5.1.2, x264 available)
- Fonts: Avenir Next and Arial Bold, with a DejaVu Sans fallback for other systems

Run from the repository root after the captures-ready handoff:

```sh
python3 scripts/render_demo.py --check --build-label CAPTURED_BUILD
python3 scripts/render_demo.py --stills-only --output-dir /tmp/coursegraph-stills --build-label CAPTURED_BUILD
```

Inspect every designed still before encoding. For a quick draft:

```sh
python3 scripts/render_demo.py --preview --output-dir /tmp/coursegraph-video-preview --build-label CAPTURED_BUILD
```

Final render:

```sh
python3 scripts/render_demo.py --url https://coursegraph.my --build-label CAPTURED_BUILD
```

Use the bundled Python path above if the shell Python lacks Pillow. `--assets`, `--output-dir`, `--fps`, `--gif-width`, and `--ffmpeg` support other environments. A full encode and GIF are initially estimated at 2–5 minutes; the final manifest reports measured wall time rather than treating this estimate as a guarantee.

## Final verification

Verify the two MP4 dimensions, duration and silent audio state with ffprobe; inspect complete scene coverage and transitions, and inspect the GIF at README size. Check that warning text and the before/after change are legible, source images belong to the approved build, the public URL is correct, and GIF size is practical. Keep the standard GIF below roughly 18 MiB; reduce its width only if necessary. Report any playback verification limits honestly.

The expected outputs are `coursegraph-explainer.mp4`, `coursegraph-wow.mp4`, `coursegraph-wow.gif`, `coursegraph-poster.png`, two `.vtt` caption files, `media-manifest.json`, and the designed frames under `compositor-frames/`. No final media has been rendered until the manifest and completed output files exist.
