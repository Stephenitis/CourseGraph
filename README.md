# CourseGraph

**Keep more than one future.**

**[Explore the live prototype](https://coursegraph.my)**

CourseGraph turns a course catalog into a map of possibilities. Read from foundations on the left toward later study and a program goal on the right. Follow a subject backward to see what it needs, forward to see where it can lead, and into a semester plan to explore how it could fit your life.

The idea comes from the skill trees in Diablo II and other games: make progression visible, let people experiment, and give them room to change their minds. Education has more exceptions than a game. CourseGraph keeps those choices and uncertainties visible too.

> “I graduated a semester late instead of a year early, this is me scratching my own itch.” — Stephen, from the original project

Start with the [project handoff](docs/HANDOFF.md) and [remaining TODOs](docs/TODO.md). Media production is deferred at Stephen’s request. The [latest live reference](docs/media/live-latest.jpg) and other images in `docs/media/` are release/interim references; the final screenshot set, explainer and README GIF are not finished.

## Try a possibility

1. Open the saved-path menu and choose **Systems Engineer Overload aka Future AI CTO**. Use **Course list** to inspect the already-planned **6.1010 — Fundamentals of Programming** without changing its selection. Its compact preview below the map shows a prerequisite gap.
2. Choose **Try a different path** and name the copy so your original idea stays available.
3. Choose a course whose requirements are met for the selected semester. Its checked circle and outlined card persist in your saved path. Locked courses open their requirements for review.
4. Try a manual repair: inspect **6.100B** through Course list and add it to **Fall 2026**, then inspect 6.1010 in **Spring 2027** through the list again. The example already has 6.100A completed, so this supplies an earlier-term prerequisite route.
5. Open **Timeline** to see semester loads. Enter advisor-confirmed remaining units to compare capacity at 36, 48, or 54 units per regular term.

These starting paths are illustrative, not records of a real student or complete degree plans.

## What the prototype does

- Explores **81 real MIT subjects** and four program views: Computer Science 6-3, AI and Decision Making 6-4, the mathematics minor, and EECS MEng 6-P.
- Arranges the map left to right in a wider, shallow rectangle, aiming for roughly **1.95:1** overall proportions. Related courses float within stable progression bands; calm curves connect them to a program goal on the right. Each view includes its available prerequisite/corequisite network: 39 subjects for CS, 56 for AI, 24 for the math minor, and 39 for MEng before personal path additions. Focus zooms to the latest inspected course or an unlocked option. Reset view uses 0.575 zoom; zoom-out and pan limits keep the graph within reach. The Minimap toggle reveals an overview that is hidden by default, with square corners and a subtle border.
- Nearby cards gently spread out on selection. Direct connections receive emphasis, while distant and unrelated routes fade. Checked course circles use pastel green.
- Shows prerequisites in cyan, onward possibilities in violet, missing prerequisite options in amber, and missing connections in red. Motion respects reduced-motion preferences; text and symbols also communicate status.
- Preserves nested **AND/OR** requirements, instructor permission, earlier-term prerequisites, and same-term corequisites.
- Click an unchosen graph card whose requirements are met—or focus it and press **Enter/Space**—to add it to the active path in the currently selected semester. Its checked circle persists with the saved plan. Click the planned card or its checked circle again to unselect it. If that would also invalidate dependent planned courses, review their names and terms before choosing **Remove N courses**; **Cancel** keeps the plan unchanged, and one **Undo** restores the removal. Valid requirement alternatives and chronological order are respected. Completed history stays intact; other courses already missing requirements or awaiting review are not swept into the removal. Course-list entries, timeline cards, and detail links inspect without toggling.
- Keeps multiple named paths in an expandable sidebar with a persistent icon rail, an explicit collapse/expand control, duplication, Undo, and shared completed-course history. Export, Import, and Share stay at the bottom of the rail.
- Shares a snapshot link that another person can preview, then explicitly add as a new saved path. It transfers course choices and semesters, never the sender's earned-credit status or advisor-review record. Each person keeps a separate local copy.
- Plans across eight regular semesters, with known-unit totals, source-linked MIT workload guidance, and optional capacity comparisons.
- Starts with a restrained **MIT** appearance and offers **Plain, Dark, MIT, NYU, Stanford, and Virginia Tech** themes. Graph meanings and curriculum-role surfaces remain consistent. Every theme still uses MIT data.
- Supports keyboard course inspection and a responsive layout.
- Starts with a quiet **Full map** overview on a framed cool-slate canvas. The compact program row leaves room for the graph; Course map, Timeline, and Course list live in the sidebar. Choosing a course opens its compact preview below the map at every width; the toggle returns to the overview.
- Labels subjects **Foundation, Core, Advanced, or Graduate** using documented MIT curriculum groups and published subject levels, with **Undergraduate** as the fallback. Foundation and Core are CourseGraph's short names for those groups; roles can vary by program and are not difficulty scores or class years. Real prerequisites take precedence when ordering the map. The small **Course numbers & labels** guide beside the legend in a light-grey row explains the labels and MIT numbering; see [curriculum-role sources](docs/CURRICULUM-ROLES.md).
- Uses consistent 4:3 rectangular cards with bold, full-width titles and no subject icons. Foundation cards are white, Core blue, Advanced purple, and Graduate dark grey, with a neutral Undergraduate fallback. Saved choices retain their level color and a pastel-green checked circle. Selecting a locked course turns its card yellow and emphasizes the lock while opening its requirements. Prerequisite, onward, and missing connections retain their own colors.
- Shows the program goal as a large original enamel crest, combining a beacon, circuits, an open book, and laurel in cardinal, ivory, and bronze. Its **Mapped coursework** progress bar sits underneath. Solid fill represents completed coverage; the lighter reach includes valid planned coursework. Even 100% covers only the modeled requirements. A separate explicit advisor-review record adds the milestone check; it is your record of major fulfillment, not institutional verification. Further study still requires separate advising and admissions review.
- Offers program-related talks and short lectures linked from MIT sources through **Explore the field**. These connections are editorial suggestions, not official program recommendations; see [inspiration sources](docs/INSPIRATION.md).

The remaining screenshot and film deliverables are tracked in the [media TODO](docs/TODO.md#media--deferred-at-stephens-request).

## Run locally

Use **Node.js 24** and npm; Node.js 22 or newer is supported. No database, API key, or account is required.

```sh
git clone https://github.com/Stephenitis/CourseGraph.git
cd CourseGraph
git checkout master
cd web
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

```sh
# From web/
npm test
npm run build
npm run preview

# From the repository root: check the catalog importer
python3 web/scripts/test_ingest_mit.py
```

The runnable prototype is in `web/`. The older Rails application remains in the repository as project history and is not needed to run this version.

## How it works

| Part | Implementation |
| --- | --- |
| Interface | React 19, TypeScript, Vite |
| Course map | React Flow, deterministic organic layout from left to right, obstacle-aware curves, custom course cards |
| Requirements | Pure TypeScript expression evaluator with explicit met/missing/review states |
| Catalog | Checked-in MIT 2026–2027 snapshot, generated by a reproducible Python importer |
| Decisions | Versioned browser localStorage, validated JSON import/export, previous-version recovery |
| Hosting | Static build in `web/dist`; compatible with static hosting and a Vercel project rooted at `web` |

Paths save **on the current browser and device**. Export a JSON backup to move them elsewhere. Clearing site storage removes local paths. Supabase authentication and cloud sync are not connected in this prototype.

**Share** creates a snapshot link containing the path name, program, catalog year, selected course IDs, and semesters. Anyone with the link can preview it; **Add to my saved paths** creates a new local plan without overwriting existing paths. All transferred choices become planned courses, even if the sender marked them completed; only the recipient's own completed history is retained. Profile details, advisor-review records, remaining-unit estimates, and pacing settings are excluded. This is a snapshot, not live collaboration or a cloud account. Oversized paths can be exported as a file instead.

The **Stephen’s** heading and generated student placeholder portrait are a local prototype profile placeholder. They do not represent a signed-in account or an identity verified by a school. The avatar has no account or authentication action.

An advisor-review record belongs to one path, major, catalog year, and completed-course history. Changes to that scope clear the milestone; ordinary future-course planning does not. You can remove a record or undo the change. Copied and newly imported paths need their own review record.

School appearance is separate from course semantics. MIT is the default visual context; university accents stay simple and restrained. This is an independent prototype using a partial catalog, with no university endorsement implied. Extending to another university means adding a catalog adapter, program rules, source dates, and term conventions; changing a theme does not import a school.

See [hosting and custom-domain setup](docs/DEPLOYMENT.md). **coursegraph.my** has active DNS routing and HTTPS; the [platform address](https://coursegraph-paths.rlze.chatgpt.site) also remains available.

## Data and honest boundaries

The catalog snapshot was retrieved on **October 23, 2026**, using FireRoad and official MIT course and degree pages. Each course links to its source. See [data provenance and ingestion](docs/DATA.md), [MIT workload rules](docs/WORKLOAD.md), and the [logic coverage matrix](docs/LOGIC-COVERAGE.md).

This is an exploration tool, **not a certified degree audit or a graduation forecast**. The four program views retain manual review for credit allocation, equivalencies, electives, degree overlap, admission, and other rules outside this subset. A downstream highlight means a course contributes toward another course's requirements; it does not guarantee eligibility.

Neither completing the mapped subjects nor entering zero remaining units automatically fulfills a major. The advisor-review milestone does not certify GIR completion, award a degree, change your remaining-unit estimate, or grant graduate admission.

**Real scheduling conflicts are not yet available.** This snapshot has no validated term-specific section meetings, so the app says “Schedule unverified.” The conflict engine is tested and ready for selected-section data; seasonal offerings alone cannot establish a conflict-free timetable.

Remaining-semester comparisons require a user-entered, advisor-confirmed unit balance. They measure capacity only. Course sequencing, availability, thesis work, and approvals can extend the calendar. Undergraduate workload references should not be treated as approved graduate loads.

## Screenshots and films

Media work is paused until Stephen asks to resume. The planned 52-second school explainer and 10.8-second demo loop will be captioned motion presentations edited from actual prototype screenshots. They will not imply continuous mouse interaction. The README GIF will play without sound; the MP4 will retain higher resolution. Final capture, rendering, and media-link verification are still pending.

See the [storyboard and capture instructions](docs/media/STORYBOARD.md). When media work resumes, capture a consistent approved build before running the prepared renderer:

```sh
# Requires Python, Pillow, FFmpeg, and Avenir/Arial or DejaVu Sans fonts
python3 scripts/render_demo.py --check
python3 scripts/render_demo.py --stills-only
python3 scripts/render_demo.py
```

The [design notes](docs/DESIGN.md) and [usability review](docs/USABILITY-REVIEW.md) record design decisions and observed issues. The teenage student walkthrough is a fictional persona exercise, not a claim of research with real students.

Built by Stephen [@Stephenitis](https://github.com/Stephenitis). A clearer view of the choices ahead, with room to change your mind.
