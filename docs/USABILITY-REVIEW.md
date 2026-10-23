# CourseGraph usability review

## Status and method

This review began with a **fictional 16–17-year-old student persona**, not research with a real teenager. No participant was recruited, observed, or quoted. Design hypotheses below are prompts for review, not findings about actual users. Source review was performed against `docs/PROTOTYPE-DELIVERY.md` and the approved theme sketch. The runtime records below distinguish this reviewer's direct observations from integration evidence supplied by the root agent, and identify which implementation iteration each covers.

The fictional student, Alex, is 17, considering computing and mathematics, and comfortable with everyday apps but unfamiliar with college catalog terminology. Alex wants to compare options without assuming a permanent choice, may not know the difference between a prerequisite and a degree requirement, and may use the app on a phone. These are deliberate test conditions rather than demographic generalizations.

## Task-based walkthrough plan

| Task | What the reviewer will do | Success evidence | Likely misunderstanding to check |
| --- | --- | --- | --- |
| Understand the page in 10 seconds | Open the default view without reading documentation | Can identify current catalog, saved path, and a course to explore | Map mistaken for a game or completed academic record |
| Discover what a course opens | Hover/focus, then pin a course and inspect later connections | Can name a next possibility and understand other requirements may remain | Violet link mistaken for guaranteed eligibility |
| Repair a missing prerequisite | Find an amber course/red connection, inspect the rule, add a prerequisite in an earlier term | Warning changes for the correct reason; added course and term are visible; undo works | Any selected course assumed sufficient regardless of timing |
| Interpret alternative requirements | Inspect an actual ANY/OR requirement | Can tell one branch is enough and unused branches are alternatives | All options appear mandatory or red |
| Compare futures safely | Duplicate a path, rename it, change a choice, then compare with original | Original remains unchanged; shared/different courses are understandable | Editing a hypothetical path changes completed history |
| Trust saved work | Edit a plan, reload, export/import, and test deletion recovery | Saved state survives; recovery and version errors are clear | “Saved” interpreted as cloud sync across devices |
| Change school appearance | Switch MIT to NYU/Stanford and read catalog context | Can explain that data is still MIT | Theme mistaken for a university/catalog selector |
| Assess scheduling | Open future-term scheduling with missing meeting data | Can tell that conflict detection is unavailable, not all-clear | “No conflicts” inferred from empty data |
| Use a phone | Open narrow viewport and switch a saved path, inspect course, and assign a term | Text remains readable; controls are reachable; no hover dependency | Details only discoverable by mouse hover |
| Use keyboard/reduced motion | Navigate without pointer; focus/pin a course; enable reduced motion | Same meaningful information and actions are available; flow stops | Color/movement is the only explanation |

## Design-stage recommendations

These are recommendations based on the sketch, not observations of the running prototype.

1. **Keep appearance and catalog identity visibly separate.** “Theme” plus “Appearance only” is clearer than an unlabeled school name. Maintain a visible MIT catalog badge after every selection.
2. **Use “Where it can lead” rather than “Unlocked” unless complete eligibility is known.** The original concept intentionally includes partial connections; that nuance needs visible UI language.
3. **Show planned and completed status separately.** Adding a prerequisite to a path must not imply the student has passed it. An earlier-term prerequisite can make a plan coherent while still remaining a future action.
4. **Make warning repair specific.** A button such as “Add [course] to Fall 2026” is easier to understand than “Fix.” If several options satisfy an OR rule, ask the student to choose one in context instead of silently selecting all.
5. **Protect the active inspector from hover flicker.** A pinned course should remain actionable when the pointer crosses other nodes toward the inspector. Offer a visible clear/reset action.
6. **Communicate local storage honestly.** “Saved on this device” is appropriate for a guest prototype. Show export as a practical backup. Do not use a cloud icon before sync exists.
7. **Treat scheduling unknowns as a visible state.** An empty schedule is not evidence of no conflict. Use explicit text and preserve any useful known term-offering constraints.
8. **Keep deletion recoverable.** An immediate undo or recoverable archive is friendlier than a modal on every delete, and reduces fear when experimenting.
9. **Make comparing paths explain differences.** Course-set and term-placement differences are more legible than two full graphs at half width.
10. **Keep the first map small enough to read.** A focused, real-data neighborhood is more useful than the appearance of completeness. Ensure search can reveal courses outside the current view.

## Implementation source review — before browser testing

The first implementation source was reviewed while it was still being built. These observations were sent to the app owner; they require retesting against the final build rather than being treated as final defects.

| Priority | Source observation | Requested correction / verification |
| --- | --- | --- |
| High | RequirementTree labels unmet leaves “Needed” in ANY/count/units groups even when other options may satisfy the group | Distinguish required missing branches from available alternatives; test both satisfied and unsatisfied OR groups |
| High | A visual progress bar uses arbitrary count multipliers without a defined requirement denominator | Remove the apparent progress metric or replace it with an honest defined quantity; simple counts are sufficient |
| Medium | Completed status lives within each saved path | Synchronize real completed history or explicitly disclose that it is a path-specific scenario assumption |
| Medium | Imported catalogYear is accepted without matching the loaded catalog | Show a persistent review notice for version mismatches |
| Medium | The default graph can include up to 52 nodes and then fit all of them | Inspect actual readable size; prefer a focused default with a clear route to the full subset |
| Low | Map guidance says clicking a course makes it yours, but the action only pins details | Use copy that matches the immediate effect |

## Runtime review record

### First local-preview pass — October 23, 2026

Reviewed the running Vite app at `http://127.0.0.1:5173/` using the in-app browser, at an observed **1280×720** viewport. This was an expert interaction walkthrough using the fictional persona's tasks, not a real student study. The app was actively changing; items below are a record of the inspected state and were sent to the app owner for correction.

Observed strengths:

- The warm surfaces, CourseGraph mark, restrained typography, saved-path cards, and semantic edge colors form a coherent visual design.
- The “MIT Catalog 2026–2027” context and “Appearance only” label are visible together.
- Searching for a deliberately nonexistent term returns “0 courses in this search” and a useful empty state.
- Timeline explicitly says “Meeting times unavailable” and explains that conflicts cannot be checked without verified section data. No all-clear scheduling claim was shown.
- Requirement alternatives are now labeled “Option” or “Alternative” rather than all being called required; the arbitrary progress bar was removed.

Findings requiring retest:

| Priority | Actual observation | Requested adjustment |
| --- | --- | --- |
| High | At 1280×720 the header, title area, and bottom tray leave about 350 px for the graph. Course labels render very small and the inspector's requirements/warnings are below a long description. | Compress surrounding chrome, prioritize requirement status, collapse description, and maintain readable map scale. |
| High | 6.1210 is saved in Fall 2027, but the initial global term is Spring 2027; its default red warning describes a hypothetical move before the student requests one. | On selecting an assigned course, initialize the target term to its actual assignment; clearly label subsequent move previews. |
| Medium | Only the first saved path is fully visible and the second is partly cut off in a short scrolling rail. | Make the three initial alternatives visible or give the paths panel more height. |
| Medium | Pressing Return on focused graph node 6.100B previews it, but Tab returns to 6.1210; the new course was not pinned even though its accessible label says to press Enter. | Add explicit Enter/Space activation tied to the app's pinned-course state, then retest. |
| Medium | Timeline renders 6.1910 as “Planned” when its requirement evaluation requires manual review. | Expose “Needs review” in timeline and other compact status surfaces. |

Not yet tested in this pass: a phone viewport, real screen-reader behavior, all theme contrast combinations, reduced-motion runtime, complete export/import/deletion recovery, and end-to-end prerequisite repair. No claim of compliance or universal task success follows from this review.

## Suggested future real student study

After the prototype is stable, recruit a small set of willing prospective or current students and have them attempt the tasks without coaching. Obtain appropriate consent for any minor participant, capture no unnecessary personal academic records, and ask students to explain what the colors and statuses mean. Record task completion, misinterpretation, confidence, and moments requiring help. A simulated persona review cannot establish that the product is understandable to real teenagers or useful in academic advising.

### Revision retest — October 23, 2026

After reloading the revised preview at the same 1280×720 viewport:

- The three original saved paths are visible, and the header/tray use less vertical space.
- The focused map settles at a larger, more readable zoom; contextual neighboring courses may extend beyond the viewport and remain reachable by panning.
- Selecting an existing 6.1210 assignment initializes the actual Fall 2027 term. Its earlier planned prerequisite is correctly in place, and the inspector shows the current assigned term.
- Keyboard Return on 6.100B pins it. Moving focus to the course-search field leaves 6.100B in the inspector. This retest resolves the earlier Enter-pinning finding.
- Course description is collapsed behind “About this course.” A remaining short-viewport recommendation is to place the compact missing-requirement summary directly below course metadata, above the scrolling rule tree and sticky action.

No mobile emulation capability was exposed by this browser interface, so phone behavior remains unverified in this review. No data-changing plan actions were performed by this reviewer during this pass; persistence, repair, and recovery checks belong to the integration test record.

The final layout adjustment moved the compact amber prerequisite summary directly below metadata. It was visible above the sticky action in the 1280×720 review, resolving the warning-visibility concern. Full nested alternatives remain intentionally scrollable. A live source update occurred during the final interaction, so no additional interaction defect is inferred from that transient state; integration checks should use a stable built preview.

### Follow-up user feedback and next acceptance checks

The user subsequently requested full readable course-card titles, a primary graph window, more distinct panels tied visually to the selected course, and a small whole-rendered-graph overview. The first desktop review therefore does not constitute final acceptance of responsive layout.

Next checks should use the current 612×824 viewport and a stable build:

- The graph remains the main visible workspace rather than being followed by a long expanded inspector by default.
- Long titles wrap completely with no overlap, cropping, or ellipsis; Dagre spacing matches the actual node height.
- Selected course and details panel share a recognizable outline/chip accent, while prerequisite and warning colors retain their meaning.
- The overview map stays out of the main course/legend content, displays the viewport clearly, and lets the user navigate without immediately snapping back.
- At 761–1050 px the responsive layout does not retain three cramped columns.

Concrete guidance for these changes was sent to the app owner. Runtime verification of the updated compact layout is pending.

### Revised panel/title screenshot review

Inspected the actual 1280×720 capture `docs/media/layout-review.jpg` after the full-title and panel changes. The selected course title is readable in full, the inspector and selected card share a clear accent treatment, the warning is immediately visible, and the panels have distinct neutral surfaces. Neighboring cards extend beyond the map's viewport; that is panning context rather than text bleeding from a card. A final introductory capture should frame at least one whole prerequisite and one whole later course to make the product's relationship model immediately legible.

The overview map was blank in this capture apart from its viewport shape. This was reported to the app owner and was a blocker in that inspected iteration. **It was subsequently resolved in the first public deployment**, as recorded below. No additional blocking design issue was identified in this static capture. This reviewer had no active browser surface at this point and therefore does not claim a new interactive or reduced-motion runtime test from the screenshot.

### Root-agent integration evidence — first public deployment

The root agent supplied the following completed checks on October 23, 2026. This is integration evidence from the root agent's browser work, not a second independent execution by this reviewer and not a student study.

| Check | Reported observed result |
| --- | --- |
| Overview map | The first public deployment rendered 39 SVG node rectangles and visibly showed the mini nodes. This resolves the earlier blank-minimap finding for that deployment. |
| Saved alternatives | Duplicate and rename worked; the changed name/path survived reload. |
| Recoverable deletion | Delete followed by undo restored the saved path. |
| Prerequisite repair | A copied path's missing prerequisite for 6.1010 was repaired by adding 6.100B in an earlier term. The original path remained unchanged. This establishes coherent planned ordering, not actual earned credit. |
| Narrow saved-path access | The saved-path drawer was exercised at a 390 px viewport during an earlier iteration. |

These checks **predate the latest upward mountain graph, program-goal emblem, advisor-review record, and inspiration-panel pass**. They should not be read as final verification of those new features or of the final responsive layout. In particular, the updated graph must retain a populated minimap, readable course titles and reachable controls at wide, medium and narrow widths. The new review record needs explicit wording that distinguishes a student's recorded discussion from institutional degree verification. The inspiration links should preserve the plan and disclose the external destination without autoplay.

Final screenshots and interactive checks of the latest feature pass are pending. Real screen-reader behavior, all theme contrast combinations, and reduced-motion runtime remain outside the completed evidence recorded here.
