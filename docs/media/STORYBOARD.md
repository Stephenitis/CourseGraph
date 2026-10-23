# CourseGraph demo media

The forthcoming demo films will be edited motion presentations made from real prototype screenshots. They will not imply continuous mouse interaction. The compositor never generates a UI state, fakes a click, or claims an unimplemented capability. A screenshot manifest records which actual states were used. Final capture and rendering are pending.

## Capture inputs

Use consistent desktop viewport dimensions and a clean app state. The final handoff is a fresh, explicitly approved capture set in `/tmp/coursegraph-final-captures`, separate from older QA screenshots in this folder. Capture the frozen build at the same 1280×720 laptop viewport for every state; use a larger consistent viewport only if needed for readability. JPEG (`.jpg` or `.jpeg`) is preferred for browser captures; PNG is also accepted. The script selects JPEG first when both formats exist. Do not capture account secrets, browser password UI, email, or unrelated tabs. Before capturing, verify the visible course requirements and path states against the current data.

| Filename | Capture | Required? |
| --- | --- | --- |
| `overview.jpg` | The default MIT Map only view: a wide left-to-right course map, program goal on the right, and catalog identity | Yes |
| `prerequisites.jpg` | A focused saved course with its persistent checked circle, compact below-map preview, and incoming/outgoing relationships visible | At least two named states besides overview |
| `missing.jpg` | A real missing prerequisite, its warning, and broken connection | Recommended |
| `autofill.jpg` | The applied full-program Autofill draft, with its decision explanation and Undo action visible | Optional; preferred drafting beat when verified |
| `resolved.jpg` | The same plan after a valid earlier-term prerequisite repair, with changed validation | Optional; enables a real repair sequence |
| `removal.jpg` | The actual dependent-removal warning, including affected names/terms and Cancel/Remove controls, before mutation | Optional |
| `paths.jpg` | Expanded saved-path menu alongside the persistent icon rail, with actual named paths and local-browser save context; no unimplemented comparison view | Recommended |
| `share.jpg` | The actual shared-path preview with its choices, terms, and explicit Add to my saved paths action | Optional |
| `timeline.jpg` | Actual semester view including honest scheduling uncertainty | Optional |
| `summit.jpg` | The large four-symbol enamel program-goal crest on the right, with its mapped-coursework bar and actual completed/planned labels; the filename is retained for compositor compatibility | Optional |
| `inspiration.jpg` | The implemented inspiration disclosure, showing speaker, year, topic and official MIT source | Optional |
| `themes.jpg` | An alternate theme with MIT catalog identity still visible | Optional |

Capture at least 1000×500; prefer 1600×900 or larger. Screenshots are letterboxed rather than stretched or cropped away from important context. Missing optional states are skipped. The compositor requires three distinct captured states to avoid a long film built around one picture.

## Film 1: school-facing explainer

52 seconds, silent, with readable on-screen captions and a separate WebVTT file. Opens with “A clearer way to see your future.” Real UI states then show the horizontal course map, missing requirements, the applied full-program Autofill draft with its decision tour and Undo or a verified manual repair, saved alternatives, semester planning, and restrained university appearance. Optional verified captures can show the large right-side program crest and the public-talk inspiration disclosure. The close is “Keep more than one future.” followed by the verified public URL.

The presentation uses warm neutral backgrounds, charcoal typography, restrained MIT identity, cyan/violet/amber relationship accents, short crossfades, and a very slight push-in. The captured app has a distinct textured cool-slate map, persistent sidebar icon rail, compact toolbar without Search or a Program goal shortcut, and a large crest within the map itself. The app gets most of each frame; captions sit outside its content. Preserve the sourced curriculum-role surfaces, strong ink-blue pinned card, and simple university styling. Cards show Foundation, Core, Advanced, Graduate, or the Undergraduate fallback as plain text, with no four-bar ratings or Inferred/Provisional tags. No voiceover or licensed music is assumed.

The school value proposition is exploratory clarity and a useful starting point for guidance. It does not claim a certified degree audit, admissions prediction, guaranteed eligibility, cross-school catalog support, SIS integration, institution adoption, or real timetable availability when none exists.

Every screenshot scene includes a restrained note identifying local-browser saves, no sign-in, partial MIT data, and no degree certification. The closing frame repeats the persistence and scope limits. The **Stephen Nguyen’s** heading and initials avatar are a local profile placeholder; never frame them as a logged-in account, school identity, cloud sync, or authentication feature.

An optional sharing scene may show the implemented snapshot preview. It transfers the path name, program, catalog year, selected IDs, and terms; all incoming choices become planned unless the recipient already completed them. No earned-credit status, advisor review, profile, remaining-unit estimate, or pace transfers. Capture the recipient's explicit **Add to my saved paths** control and describe a separate local copy, never live collaboration or a cloud account. Export, Import, and Share are at the bottom of the persistent rail.

## Film 2: README wow loop

10.8 seconds. Preferred sequence: focus a course → reveal a missing prerequisite → show the applied draft or legitimate repair → show another saved future. When `autofill.jpg` exists, the third beat shows the real full-program Autofill result and mentions one-click undo. Otherwise it uses `resolved.jpg` for a manual repair. If neither is available, the loop shows only the real available states and does not claim that a repair occurred. Durations normalize to 52 seconds for the explainer and 10.8 seconds for the loop regardless of the number of optional captures. A screenshot of a tour step establishes that step only; edited stills must not imply a continuous recording of the tour.

The deliverables are a 1920×1080 MP4, a 1200 px wide optimized GIF for inline README animation, a poster PNG, and captions. The GIF has no dependence on sound. Link the higher-quality MP4 from the README. Do not claim an embedded MP4 will autoplay in GitHub's Markdown renderer. A static poster still communicates the product when motion is disabled.

## Reproducible render

Run the asset check first:

```sh
/Users/eeveehome/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/render_demo.py --check
```

Review designed stills before an expensive full encode:

```sh
/Users/eeveehome/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/render_demo.py --stills-only --output-dir /tmp/coursegraph-stills
```

Create a faster 960×540 preview:

```sh
/Users/eeveehome/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/render_demo.py --preview --output-dir /tmp/coursegraph-video-preview
```

Create final media after visual approval of the captures and stills:

```sh
/Users/eeveehome/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/render_demo.py --url https://coursegraph.my
```

The final public address supplied by the root agent is `https://coursegraph.my`; it is also the compositor default. Recheck that address during the final publication pass. The script needs Python with Pillow, FFmpeg, and either the macOS Avenir Next/Arial fonts or a DejaVu Sans fallback. Use `--assets`, `--output-dir`, `--fps`, `--gif-width`, and `--ffmpeg` to adapt it to another environment.

Before publication: watch the complete MP4s, inspect the GIF at README size, verify narration/captions against actual behavior, check the final URL, and ensure no warning text is cut off. Screenshots and video are documentation of the captured build and should be refreshed after significant UI changes.

## Final interaction capture checklist

Record the build identifier and approved filenames at handoff. Supply the fresh capture directory through `--assets /tmp/coursegraph-final-captures` and output final films to `docs/media`; do not let older QA files silently enter the film. The renderer remains paused until that handoff.

On a duplicated local path, verify that clicking an unchosen graph card adds it to the visible selected semester, shows its checked circle, and persists after focus changes and reload. A second planned-card click or checked-circle click unselects it. If other supported planned courses would lose their requirements, capture the actual **Remove N planned courses?** warning and affected-course list before any mutation. Verify Cancel leaves the plan unchanged, confirmation applies the proposal, and one Undo restores every removed entry. Valid alternatives and chronology must be respected; completed history remains, and other already-missing/manual-review courses are not swept into the removal. Check equivalent Enter/Space body and native circle-button actions. Course-list entries, detail links, timeline cards, and tour steps only inspect. Undo test changes before capturing the chosen narrative state. A check means a saved hypothetical plan choice, not eligibility, enrollment, or degree completion.

Keep the compact preview below the map, the target semester, and the relevant warning visible when their meaning matters. Preserve the final sourced role labels, readable course title, blue pinned card, and checked-state control. For a warning shot, inspect the already-planned 6.1010 example through Course list, a timeline card, or a detail link; clicking its graph body would toggle its planned membership. Capture the real Autofill result with Undo and the actual uncertainty text; stop or pause the tour deliberately for a legible frame. Do not simulate pointer clicks or construct missing application states in the compositor.

## Final horizontal map and milestone framing

Final capture and rendering are on hold until the wider left-to-right graph, MIT identity, below-map preview, full-program Autofill decision tour, large program crest, advisor-review record, and inspiration panel have passed the root agent's UI checks. Earlier screenshots show an older layout and are not the final product evidence.

Frame one readable foundation course to the left of a readable later course, with a calm curved connection between them. A whole-graph overview establishes the roughly 1.95:1 wider, shallow footprint and the program goal on the right; close framing then makes course names and warnings legible. Organic spacing groups the documented curriculum roles, with actual prerequisite constraints taking precedence. Role labels may vary by program; never caption them as difficulty scores or class years. The small **Course numbers & labels** helper below the legend can explain the sourced labels and MIT numbering. MIT is the default appearance, and the partial independent-prototype context remains visible. Verify the final role labels against [the source mapping](../CURRICULUM-ROLES.md) before capturing.

The right-side enamel crest is a program goal beyond this partial course map. Preserve its substantial overview size and its beacon, circuits, ivory book, and laurel imagery. Keep its **Mapped coursework** label and the completed/planned distinction readable. A 100% bar is not degree completion. If a check medallion appears after the student records an advisor review, show the actual “review recorded” language. Do not caption it as MIT verification, an awarded degree, or automatic access to graduate study. The introductory film can simply show the unrecorded goal; a review record is optional and must not be manufactured just to obtain a celebratory frame.

For inspiration, capture CourseGraph's actual text links and attribution. Do not copy or play parts of the linked MIT videos inside the promotional film. A small panel is enough to establish that a student can explore ideas behind the subject, then return to their plan.

For Autofill, use a real copied plan with missing prerequisites. The primary button drafts the modeled program requirements and their prerequisites, applies the draft immediately, and walks actual additions and moves at 1.5-second intervals. **Pause**, **Resume**, and **Skip walkthrough** control the tour. It may reposition planned courses while preserving completed history. Inspect the tour's actual pacing, decisions, resulting term ordering, alternatives, and remaining uncertainty; confirm that **Undo, make my own choices** reverses the single change, then reapply to capture the real result. The applied-state shot must show changed plans and the visible undo control. **Fill missing prerequisites** is the separate dropdown alternative and should be identified as such if used. Do not imply all alternatives are required, that unknown conditions are resolved, or that enrollment/degree approval occurred. If the implementation or capture cannot support the caption, omit the optional state. Final rendering remains on hold until the root agent supplies the final captures.

## Verified repair candidate in the current catalog snapshot

The illustrative **Systems Engineer Overload aka Future AI CTO** path plans **6.1010 Fundamentals of Programming** in **Spring 2027**, and marks **6.100A** completed. The current ingested prerequisite expression is **6.1000 OR (6.100A AND (6.100B OR 16.C20))**. A useful manual-repair capture sequence, separate from the full-program Autofill demonstration, is:

1. Inspect 6.1010 through Course list and capture the actual missing-requirement state.
2. Inspect 6.100B through Course list and add it to Fall 2026.
3. Inspect 6.1010 through Course list again and capture the resolved planning requirement.

This is a legitimate example in the current data: 6.100B is listed for Fall/Spring and accepts 6.100A or instructor permission, while the sample already marks 6.100A completed. It establishes a coherent hypothetical order, not evidence that the student actually completed 6.100B. Verify the current UI result before filming, and make sure unused alternatives are labeled as alternatives rather than additional mandatory requirements.
