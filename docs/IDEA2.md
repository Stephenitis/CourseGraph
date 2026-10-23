# Idea 2 — course unlock experiment

Route: `/idea2`. The original `/` map remains unchanged. The experiment is lazy-loaded, with scoped styles and transient in-memory selections. It never writes saved paths or earned history.

## Current skill-tree correction

The paginated compact workspace was rejected. Every course is now rendered on one pan/zoom map, fitted on load. Cards have direct +/check controls; locked controls inspect requirements. Green identifies selected courses/links, gold identifies missing preparation for the focused course, and purple identifies available successors supported by selected courses. The inspector remains beside the map. Course positions do not move with selection.

Selection uses shared requirement evaluation, excluding self-credit. ALL/ANY, units, distinct counts, corequisites, and manual-review blocks are enforced for modeled preparation. Removal cascades only where remaining choices no longer support a course; Undo restores the prior set. Semester scheduling and actual earned credit remain outside this sandbox.

Focused tests cover alternative-preserving removal and requirement gating. Browser checks verified all 39 CS nodes, direct selection, locked prerequisite highlights, unlocking 6.1020 through 6.1010, removal relocking, and Undo restoration. Production build passed.

## Earlier design iterations (superseded)

- Four compact stage tabs progress left to right by prerequisite depth. Display six course cards per page, with available courses first. These are dependency bands, not difficulty scores.
- Selected cards are green, available cards have a green border, locked cards are muted, and missing prerequisite options are gold when inspected.
- Inspecting a card opens a dedicated side panel on desktop (in-flow details on mobile) showing nested ALL/ANY/count requirements. Selecting ready preparation unlocks later courses. Manual requirements remain review-only.
- A collapsed-by-default requirements summary and expandable slot tray displays the program's actual modeled requirements as empty/filled slots. Clicking a slot highlights contributing course options. Unknown/permission requirements remain explicit advisor-review blocks.
- Three introductory seed choices make the initial demonstration readable; Start with empty slots resets only the transient experiment. Reload restores the seed. No semester scheduling or degree certification is implied.
- Removal rechecks dependent experiment selections. Program changes retain the current experiment selections, including subjects shared across programs.

## Feedback to gather

1. Should course unlocks or the requirements tray dominate the screen?
2. Does selecting a card to inspect, then choosing it in the detail panel, feel clear?
3. Should progression remain left to right or become an upward skill board?
4. Are missing options discoverable when they are outside the current scroll position?

## Focused verification

Production TypeScript/Vite build. Browser smoke checks: inspecting 6.1020 highlights 6.1010; selecting 18.02 unlocks 18.06; locked selection is disabled. The experiment uses the existing requirement evaluator. No unrelated test suites or media production were run. This is an initial visual iteration, not a complete degree planner.

## Compact interface iteration

The large intro and simultaneous tall columns were replaced with a compact decision workspace. Desktop displays six cards plus a non-overlapping inspector; smaller screens use two card columns and inline details. Stage controls and pagination retain access to every course. Browser checks verified a 1153px-wide viewport without horizontal overflow, course selection, next-page navigation, and locked-course prerequisite details. Short desktop screens use reduced spacing without shrinking controls.
