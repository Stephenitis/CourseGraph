# CourseGraph handoff — October 23, 2026

## Restoration

At Stephen’s request, the app and documentation were restored to the original `ea8a5aa` handoff snapshot. Later geometric-routing and `/idea2` experiments remain recoverable in Git history but are no longer part of the running app. Browser storage and saved plans were not cleared or migrated.

## Main-map connection update

Selected, semester-supported connections remain solid green in the overview and during exploration. Hovering any course temporarily reveals its prerequisites and dotted violet onward possibilities, including in Full map mode or with another course focused. Leaving restores the focused context. Hover does not change the plan, camera or layout; connection bend radii stay constant. Possibilities indicate potential contributions, not automatic eligibility. Selection and prerequisite rules remain unchanged. Validation: 138 TypeScript tests and production build passed.

## Map motion and effects

Saved routes carry staggered traveling light, and direct onward possibilities receive their own light trails over flowing dotted lines. A mint/violet ambient wash, softer rounded cards, colored hover halos, and checkmark arrival effects add depth without moving connection endpoints. Curriculum colors and the 4:3 card geometry remain intact. Reduced-motion preferences disable the new moving effects. Effects use CSS/SVG with no animation dependency. Validation: 15 focused route/selection tests and production build passed.

## Semester journey and hypothetical outcomes

Every assignment already stores `courseId`, `term`, and `status`. The map now reveals completed history, then each planned semester in chronological order on entry/path switch, with card ignition and staged connections. Skip, interaction-to-skip, Replay semesters and reduced-motion support keep the map usable.

A connected semester rail previews matching cards on hover/focus; clicking pins the highlight and changes the target semester for new selections. Open semesters remain available through the prototype planning horizon, ending in an advisor-reviewed degree goal, not a guaranteed graduation date. Cards show their saved semester.

Each path can store optional `hypotheticalOutcomes` keyed by course ID (A/B/C/D/F/Pass/Fail). Card What-if controls edit these private scenario annotations; they never change completion, eligibility or degree coverage. Local reload and Export/Import preserve them, alternatives keep independent values, and share links continue to omit private metadata. Older saves need no migration. Validation: 37 focused persistence, sharing, requirements and semester-order tests passed; browser verified staged arrival, Skip, and semester card highlighting.

## Start here

CourseGraph is Stephen Nguyen's visual academic-path prototype, inspired by Diablo II skill trees. Students explore prerequisites and onward possibilities, keep alternative named plans, and place choices in semesters. The experience should feel like a thoughtful university tool: modern, personal, playful through interaction, and free of marketing copy in the working interface.

- **Live:** [coursegraph.my](https://coursegraph.my/)
- **Repository:** [Stephenitis/CourseGraph, master](https://github.com/Stephenitis/CourseGraph/tree/master)
- **App release:** [PR #1](https://github.com/Stephenitis/CourseGraph/pull/1), merged to master as `2babc38e75bd14932524b4de9170f337e4569078`. App source head was `fda36cd5e77a547934e3e6243ef214627d1ed4e8`.
- **Runnable source:** `web/`. The original Rails app remains for history and is not required.
- **Local checkout:** `/Users/eeveehome/Documents/ChatGPT/CourseGraph`.
- **Next work:** [TODO.md](TODO.md). Media production is explicitly deferred at Stephen's request.

Stephen authorized **test → build → push → merge to master → deploy** as the default future release workflow. This is an instruction for the agent, not an installed automatic GitHub deployment pipeline. No additional account is needed to keep the current prototype running.

## What works

The React 19 / TypeScript / Vite app uses React Flow with custom layout, routing and cards. Its checked-in MIT 2026–2027 snapshot contains 81 subjects and four program views: CS 6-3, AI and Decision Making 6-4, mathematics minor, and EECS MEng 6-P. Program maps include the available recursive prerequisite/corequisite network; their base sizes are 39, 56, 24 and 39 courses respectively. Personal choices can add courses.

Requirement evaluation handles nested AND/OR, course counts, unit counts, earlier-term prerequisites, same-term corequisites and manual review. A downstream highlight means a contribution toward a requirement, not guaranteed eligibility. Semester planning includes loads and optional capacity comparisons based on an advisor-confirmed remaining-unit balance.

Clicking an available graph card adds it to the active plan and term. Clicking a planned card or its checked circle removes it. If removal would invalidate previously supported planned courses, a confirmation lists the affected courses and terms. Valid alternatives are preserved, existing invalid courses are not swept into the cascade, completed history stays intact, and Undo restores the action. Locked cards inspect requirements without adding. Course-list and timeline entries inspect without toggling.

Several named paths can be renamed, duplicated, exported, imported and shared. Completed history is shared across the user's alternatives. Share produces a URL-fragment snapshot with a recipient preview and explicit import into a new path; it does not transfer the sender's earned-credit status, advisor review, profile or pacing settings.

The degree crest shows completed and valid-planned coverage of modeled coursework. A separate, user-recorded advisor review adds the milestone; 100% mapped coverage alone never certifies a degree or unlocks graduate admission. MIT-sourced talks are available through Explore the field.

## Current design decisions

- Left-to-right progression, roughly 1.95:1 overall shape, deterministic organic spacing. Selection gently opens nearby spacing while unrelated routes fade. Connections use cyan prerequisites, violet onward possibilities, amber needed courses and red missing links.
- Fixed **336×252, 4:3** course cards. No subject icons. Full-width bold titles use 28/25/23 px before map scaling, according to title length. Foundation is white, Core blue, Advanced purple and Graduate charcoal, with a neutral Undergraduate fallback. These are sourced curriculum roles, not universal difficulty scores.
- Depth increases by stage on the right and bottom. Saved choices retain their curriculum color and have pastel-green checks. Available buttons have light-grey fill and a subtle green glow. A focused locked card turns yellow and prominently emphasizes its lock.
- Default and Reset view zoom is **0.575**. Focus targets the latest inspected course or an available option at a closer scale (preferred 0.95 where space allows). Pan and zoom-out bounds keep the graph reachable.
- Minimap is **off by default**, square-cornered, subtly bordered, and positioned near the upper-right map controls. The legend has a light-grey background; its 12 px labels and the arrow-marked Course numbers & labels helper share a row.
- Square, restrained map header: placeholder portrait, **Stephen’s**, then **Systems Engineer Overload aka Future AI CTO**. The editable build name is the visual priority. **Full map**, Focus, Reset view and Minimap controls live here.
- Course map / Timeline / Course list navigation lives in the sidebar. The sidebar collapses smoothly to an icon rail, with Create path, Export, Import and Share. Preview stays **below the map at every width**.
- Search, Autofill, the top Program goal shortcut and top-bar About button are removed. Dormant autofill code and `SubjectIcon.tsx` remain; do not restore them to the UI without a new request.
- MIT is the default appearance. Plain, Dark, NYU, Stanford and Virginia Tech only change styling; all use MIT data and preserve graph semantics. Disclaimers remain small in the footer, with detailed scope accessible separately.

## Persistence and identity

There is **no authentication, Supabase database or cloud synchronization**. The profile and generated student portrait are fictional/local placeholders.

Paths use versioned localStorage: `coursegraph.paths.v1`, with prior-version recovery in `coursegraph.paths.backup.v1`. Import/export validates versioned JSON. Preserve invalid-data recovery copies and user plans when debugging.

Storage is origin-specific: `localhost`, `127.0.0.1`, different ports and `coursegraph.my` each have separate saved plans. Use **Export → Import** to move decisions; do not clear storage or assume a missing plan was deleted. Export is the current backup method. Shared links expose the encoded plan to anyone who receives the link; they are snapshots, not synchronized collaboration.

## Run and verify

```sh
git clone https://github.com/Stephenitis/CourseGraph.git
cd CourseGraph
git checkout master
npm --prefix web ci
npm --prefix web run dev

npm --prefix web test
python3 web/scripts/test_ingest_mit.py
npm --prefix web run build
npm --prefix web run preview -- --port 4173 --strictPort
```

Use Node 24; Node 22+ is supported. On this Mac the bundled Node directory is `/Users/eeveehome/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin`; prepend it to PATH if the shell runtime is absent or older. Development normally uses port 5173. Preview serves `web/dist` and requires a new build after edits. Ports 4174/4175 were temporary review servers; check listeners instead of assuming they remain active. Prefer one stable localhost origin to keep saved plans consistent.

Release verification: **135 TypeScript tests and 5 Python importer tests passed**. The six camera tests also passed after the final zoom change. Production compilation passed after the final header/legend changes. Browser inspection verified 39 CS cards at 4:3, title clearance, removed icons and curriculum colors. This was not an exhaustive final mobile, dark-mode, reduced-motion or screen-reader audit, and no real teenage user study occurred.

## Deployment and GitHub

Production is an existing public **Sites** project, `appgprj_6adb849892d08191bf9dc2fcfb1fa83d`. Its config is `web/.openai/hosting.json`; output is `web/dist`. The secondary address is [coursegraph-paths.rlze.chatgpt.site](https://coursegraph-paths.rlze.chatgpt.site). Namecheap DNS and TLS are active. Vercel is compatible but not the current host; no Vercel project was created by this chat.

Latest publication: Sites version **2**, source commit `a549d4a8312aa78b9d9aa2352ac740476cbb1a9e`, version ID `appgprj_6adb849892d08191bf9dc2fcfb1fa83d~appgver_f135bd9700a8819184cca78fafb2b111`, deployment `appgdep_6adbb5c0e848819191ecb944b756a94d`. It succeeded October 23, 2026 at 19:30:21 UTC. The custom-domain HTML was verified to load `index-CNf6gpzX.js` and `index-5UVpx71W.css`, matching the latest build.

For a future app release, read the installed Sites skill and use the existing project and public audience. Build `web/`, synchronize it into the ignored `.site-stage/` checkout (exclude `.git`, `node_modules`, `.env*` and build metadata), then use the Sites source-package helper, save a version, deploy that exact version and verify the public asset references. Pass fresh short-lived credentials through hidden stdin only. See [DEPLOYMENT.md](DEPLOYMENT.md). GitHub merge alone does **not** deploy Sites.

Both source uploads previously failed with Git RPC HTTP 400. Repository-local `http.postBuffer=524288000` and `http.version=HTTP/1.1` resolved the observed failures in the GitHub checkout and `.site-stage`. This is troubleshooting history, not a guarantee for every network failure. Do not force-push. Attach any created PR to the chat, merge only the reviewed expected head, and leave master current.

## Code map

| Concern | Location under `web/src/` |
| --- | --- |
| Views, state, map integration | `App.tsx` |
| Cards and appearance | `components/CourseNode.tsx`, `styles.css`, `lib/courseTypography.ts` |
| Layout, curves, camera | `lib/courseLayout.ts`, `lib/connectionRouting.ts`, `components/ConnectionEdge.tsx`, `lib/focusCamera.ts` |
| Legend/help | `components/CourseMapHelp.tsx`, `components/CourseMapHelp.css` |
| Requirement and selection rules | `domain/requirements.ts`, `domain/graphSelection.ts` |
| Degree coverage and review | `domain/programProgress.ts`, `domain/programCompletion.ts`, `domain/progression.ts`, `components/ProgramMilestone.tsx` |
| Saving and sharing | `lib/persistence.ts`, `lib/pathShare.ts` |
| Workload, profile, inspiration | `components/WorkloadPlanner.tsx`, `lib/profile.ts`, `components/InspirationPanel.tsx`, `data/inspiration.ts` |
| Catalog | `data/source/mit-2026-2027.json`, `data/catalog.ts`; importer at `web/scripts/ingest-mit.py` |

## Known boundaries and deferred media

The partial catalog is not a complete degree audit. All program views retain manual requirements. No doctoral curriculum is loaded; future study requires advising and admissions review. The snapshot has **no validated section meeting times**, so real timetable-conflict detection is unavailable even though the conflict engine is tested. Future seasonal offerings are not guaranteed; source dates and retired-course metadata matter.

Existing images are in [media/](media/), including [live-latest.jpg](media/live-latest.jpg), a release reference. The screenshots folder was emptied when its images were gathered into media. The collection spans several intermediate builds: do not present it as a consistent final capture set. In particular, overview/missing were refreshed separately from older prerequisites/resolved shots; paths/timeline still need capture.

The prepared `scripts/render_demo.py` and [storyboard](media/STORYBOARD.md) describe a 52-second school explainer and a 10.8-second README loop. Final captures, videos, GIF, poster, captions, manifest, playback checks and README embeds are **TODO**, not completed deliverables. Do not resume this work until Stephen asks.
