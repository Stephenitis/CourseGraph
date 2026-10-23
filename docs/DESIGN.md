# CourseGraph design direction

CourseGraph helps a student see what a choice makes possible, keep several futures open, and understand what each route still needs. Its emotional reward is clarity: a confusing catalog becomes a map the student can act on.

The visual direction is a calm academic workspace with the discovery and directional feedback of a skill tree. It should feel designed for serious personal decisions without becoming austere. No experience points, fantasy ornament, confetti, progress claims without a denominator, or generic dashboard metrics are needed.

## Composition and hierarchy

The default **Full map** view gives the graph the workspace. Choosing a course opens planning mode with saved paths and a compact course preview below the map at every width, preserving the full map width. The Full map toggle returns to the overview. A slim header carries the CourseGraph wordmark, catalog context, and appearance selector in both modes. The fixed build heading uses **Stephen’s**, with a generated student placeholder portrait at the top right. Both belong to a local prototype profile placeholder; neither implies authentication, an account service, or verified identity. Supporting panels should help the map rather than remain permanently open.

The path title is the main heading, followed by its academic direction and catalog version. Keep the program row compact and view navigation in the sidebar, and avoid repeated onboarding copy once a user is exploring. Course list provides inspect-only access outside the graph. The separate toolbar has been removed, including Search and Autofill; the actual goal crest remains on the map.

The sidebar expands from a persistent icon rail through an explicit collapse/expand control, with a smooth transition that respects reduced motion. Expanded content prominently shows named alternatives. The selected path is a white or elevated card with a narrow school-accent edge. Each path shows a human name and a short useful subtitle; long sidebar labels wrap rather than disappearing behind clipping. Active status must be visible without color. Duplicate is a first-class action. Export, Import, and Share remain at the rail's bottom; rename and deletion recovery stay accessible without competing with exploration. Guest persistence says “Saved on this device.” A sample path must be labeled as a starting example until it is edited; saving an example does not imply it is a verified academic plan.

The central graph reads left to right from foundations to later possibilities, with a distinct program goal on the right. It includes all available subjects in the selected program, their recursive prerequisites/corequisites, and personal path additions; this is still a partial MIT catalog. A deterministic organic layout groups sourced curriculum roles while preserving real prerequisite ordering, clearance, and a wider, shallow footprint near 1.95:1 width-to-height. Prerequisite constraints take precedence over role grouping. The target range is approximately 1.8–2.1:1. Hover preserves node positions. Selection may gently expand nearby spacing without changing branch order. Default and Reset view use 0.575 zoom; Focus brings the latest or an available course closer. Semester placement is explicit, and map position does not assign a term.

The below-map preview answers three questions in order: “What is this course?”, “What do I need?”, and “Where can it lead?” Keep the main action near the requirement that prompted it. Put source links, credits, offering data, and catalog date in a quiet but discoverable metadata area.

## Visual system

Use warm ivory interface surfaces, charcoal text, quiet separators, and restrained MIT accents as the default. Give the map a distinct cool-slate canvas with subtle texture and a clear frame. Distinguish it from the saved-path rail and preview through visible surfaces and boundaries. Foundation cards are white, Core cards are blue, Advanced cards are purple, and Graduate cards are charcoal; Undergraduate is a neutral fallback. Dark mode adjusts their luminance. Plain role text, typography, borders, and depth reinforce these differences. Remove the former four-bar indicators and Inferred/Provisional tags. Chosen and focused courses retain their curriculum-role surface; a pastel-green check marks saved choices and an outline marks focus. A focused locked card becomes yellow with a prominent amber lock. Relationship colors remain on connected courses and edges.

The labels are backed by the MIT curriculum groups and subject levels documented in [CURRICULUM-ROLES.md](CURRICULUM-ROLES.md). Foundation and Core are CourseGraph's concise display names, and a subject's role may vary by selected program. These are not universal difficulty ratings, suggested class years, or eligibility claims. A compact **Course numbers & labels** arrow-marked helper beside the map legend in a light-grey guide row explains that MIT numbers identify departments, areas, and variants rather than a universal difficulty ladder. Where no supported curriculum group applies, use the published Undergraduate level instead of guessing from prerequisite depth or number size.

Use a highly legible sans-serif family with clear course numbers. Path headings are approximately 30–36 px on desktop; course titles use 28/25/23 px before map scaling according to title length, with no subject icons; UI text is 13–14 px with comfortable line height. Course codes can use tabular numerals or a restrained monospace treatment. Do not make all secondary content tiny or uppercase. Use 8 px spacing increments, 8 px course-card radii, subtle borders, and progressively stronger right/bottom depth. Distinguish the pinned node through its outline and explicit selected state without a large scaling animation that shifts surrounding edges.

A small CourseGraph mark can remain constant as a product identity. School accent colors belong to active navigation, selected-path indicators, primary buttons, and a theme swatch. They must not replace semantic graph colors.

## Meaningful connection states

| Meaning | Treatment | Plain-language equivalent |
| --- | --- | --- |
| Required earlier course | Cyan node/edge emphasis, gentle directional flow toward the focused course | “What you need” |
| Later course connected to this foundation | Violet node/edge emphasis, flow away from the focused course | “Contributes toward” or “Where it can lead” |
| Missing prerequisite | Amber card outline/ring, warning icon and text | “Not yet in this path” |
| Unsatisfied prerequisite connection | Dashed red edge, matching explanation in the inspector | “Add or complete this requirement first” |
| Selected or pinned course | Curriculum surface retained, high-contrast outline and explicit selected state; yellow when locked | “Course details” |
| Saved planned course | Persistent checked-circle button and “In your path” label | Remove this planned course from the active path |
| Completed history | Static checked-circle mark and “Completed” label | History is preserved by graph controls |
| Completed course | Check icon plus completed label | “Completed” |
| Planned earlier course | Planned label and term; distinct from completed | “Planned · Fall 2026” |
| Unknown or manual requirement | Neutral notice with source | “Needs review” |

Flow is a low-intensity 2–3 second loop while the relationship is relevant. Avoid flashing red edges. Warn through a stable dashed line and text. Dim unrelated nodes only modestly so the map stays legible. The reduced-motion setting removes directional animation and retains arrowheads and labels.

Hover or keyboard focus previews without saving. Clicking or tapping an unchosen graph card, or activating its focused body with Enter/Space, adds the course to the active path in the currently selected semester and then pins its compact preview. Clicking a planned card body or checked-circle button toggles it off. A removal that affects only that course applies immediately with Undo. If downstream planned courses lose previously satisfied requirements, first show **Remove N planned courses?** with the selected and affected course names and terms. **Cancel** changes nothing; **Remove N courses** applies the entire proposal as one undoable action. Preserve valid OR/count/unit alternatives, earlier-term prerequisite rules, and same-term corequisites; mere graph connection is not enough to remove a course. Completed history stays untouched, and other courses with pre-existing missing/manual-review states are not swept into the removal.

Completed-history circles are static marks and their card bodies only inspect. Native button keyboard behavior remains independent of the graph body's Enter/Space handler. Course-list entries, detail links, and the timeline inspect without adding or removing courses.

The checked state is saved in the browser with the plan and survives moving focus to another course or reloading. It means membership in a hypothetical path, not enrollment or eligibility. Provide a visible target semester and Undo after adding or removing. Escape clears pinned focus where appropriate, without deleting saved choices. The preview remains usable when the pointer moves from a pinned node to its action; transient hover must not erase that pinned choice.

Preserve requirement logic. “All of these” and “Choose one” must be visibly grouped. An unused alternative is not a missing requirement when another branch satisfies the rule. A planned prerequisite can support a future plan when scheduled early enough, but it is not completed history. Same-term prerequisites remain unsatisfied unless a documented concurrent rule permits them. A downstream connection does not prove full eligibility. Display a complete eligibility status only if every applicable condition is evaluated; otherwise show the remaining condition or review status.

## Appearance themes

The top selector offers Plain, Dark, MIT, NYU, Stanford, and Virginia Tech, with MIT as the default. Label it “Theme” or “Appearance” and show “Appearance only” near it. The catalog badge and program-goal identity remain MIT for every theme. Selecting NYU or Stanford does not change the data, degree requirements, or current path.

The existing sketch carries the intended university accent direction: NYU violet, Stanford cardinal, Virginia Tech maroon with restrained orange, and MIT red with silver. Theme colors must not redefine prerequisite, future-course, missing-node, or missing-edge meanings. Dark mode may adjust luminance for contrast while preserving each semantic color family. This prototype's appearance studies do not claim affiliation or exact compliance with a university's full identity system.

## Planning and uncertainty

Placing a course in a term must be reversible. The action label should include the course and term when this avoids ambiguity. After a prerequisite is added, show the changed status and a nearby undo action; do not animate a celebration. The pleasure is seeing the broken connection resolve.

Autofill and its guided walkthrough have been removed from the interface. Course choices are manual and remain undoable.

The schedule view distinguishes time conflicts, known offering constraints, and unavailable data. Never report “No conflicts” if meeting times are missing. Use “Meeting times not available” and show what can still be checked. Only present a real overlap when actual sourced section meetings are loaded. Do not reuse the illustrative times from the original sketch as catalog facts.

Students can switch between saved alternatives to compare their courses and terms. A computed side-by-side difference view is not implemented. Completed history stays shared across alternatives, while term assignments and hypothetical program choices remain separate. A future MEng path needs clear admission/eligibility review language and must not appear guaranteed by a graph connection.

Share creates a self-contained snapshot link, not a shared account or synchronized document. The dialog explains that anyone with the link can preview the path name, program, course choices, and terms. Opening the link displays a read-only preview; only **Add to my saved paths** creates a new local plan. Preserve existing paths and the recipient's own completed history. Every incoming choice is planned unless the recipient already completed it; never transfer the sender's earned status, advisor record, profile details, remaining units, or pace. Invalid, mismatched-catalog, or oversized links receive a readable error; oversized outgoing plans can use file export.

## Responsive and accessible interaction

Below desktop width, keep saved alternatives easy to reach through a clearly labeled paths panel or horizontal selector. The course preview remains below the map, as on desktop. On a narrow phone, use a scrollable map region with explicit controls and a course-list alternative; do not shrink text until three columns fit.

All actions need visible keyboard focus, meaningful accessible labels, and native buttons/selects wherever possible. Keep touch targets at least 44 px. Graph edge color is redundant with textual explanations and, where relevant, dashed patterns or arrows. Course list and the preview provide a non-spatial route through the same material. Update save and validation status through a polite live region without announcing every hover. Preserve usable contrast in all six themes and honor `prefers-reduced-motion`.

## Screenshots to capture from the actual app

Deferred at Stephen’s request; see [TODO.md](TODO.md). Existing screenshots are intermediate references, not a final matching set.

1. The default Full map overview, followed by planning mode with the saved-path rail and a selected course; the opening images should explain the product without a caption.
2. A real missing prerequisite highlighted in amber with a dashed red link and explicit inspector warning.
3. The same plan after a legitimate repair, with term placement and changed validation visible.
4. Two saved alternatives with their real course differences.
5. A narrow viewport showing usable path switching and course details.
6. Scheduling uncertainty shown honestly when no real meeting times are available.

Use actual program/course labels from the ingested dataset. Keep personal account details and private keys out of all captures. Capture at a consistent desktop viewport, plus one actual mobile viewport. The screenshot set must be refreshed after the last UI changes that affect it.

## School-facing explainer storyboard: 52 seconds

This is a production plan, not a claim that the actions have already been filmed. Each shot is conditional on working functionality in the shipped prototype. Final captions should name the actual available features. Use real UI captures, purposeful framing, a consistent type system, restrained motion, and captions. The silent compositor normalizes the available states to 52 seconds; this table gives the narrative timing, while the final manifest records the actual scenes.

| Time | Actual UI action | Suggested narration / on-screen idea |
| --- | --- | --- |
| 0–5 s | Begin on a clean horizontal map with MIT identity and the right-side goal | “A clearer way to see your future.” |
| 5–13 s | Focus a sourced course and reveal incoming cyan and outgoing violet relationships | “Connect what a student has learned with what they could explore next.” |
| 13–24 s | Show a real missing-prerequisite example and a manual repair with Undo | “Make the next step visible, with room to change your mind.” |
| 24–33 s | Show a duplicated plan and its named saved alternative | “Keep more than one route before committing to a choice.” |
| 33–39 s | Show an alternate appearance while MIT catalog identity remains visible | “A consistent experience, with room for a school's identity.” |
| 39–46 s | Show source/provenance and the schedule view's actual available status | “Grounded in catalog information, with uncertainty made clear.” |
| 46–52 s | Finish with product name and https://coursegraph.my | “Keep more than one future.” |

Do not imply student-information-system integration, admissions prediction, a certified degree audit, cross-school data, institution adoption, or schedule optimization unless those features actually exist. If the implementation cannot support a storyboard action, replace that shot with another working action rather than simulating the feature.

## README wow loop: 8–12 seconds

The loop must communicate one cause-and-effect story without sound. Use an actual sourced course whose prerequisite can be legitimately repaired in the displayed plan.

| Time | Frame/action | Short caption |
| --- | --- | --- |
| 0–2 s | Clean map; pointer focuses a meaningful course; incoming and outgoing relationships appear | “See where one course can lead.” |
| 2–4 s | Pin course; amber missing node and red edge become readable | “Find the missing step.” |
| 4–8 s | Show a verified manual prerequisite repair and its Undo action | “Build your path.” |
| 8–11 s | Switch to or show a second saved alternative; end on an uncluttered map | “Keep more than one future.” |

Prefer a 1920×1080 MP4 master with readable UI, plus a 1200 px wide optimized GIF for automatic README playback and a static poster fallback. Keep the GIF to a practical repository/download size by using a focused map/inspector composition, restrained motion, and a measured frame rate. Link the higher-quality MP4 rather than claiming GitHub will autoplay an embedded video. Avoid quick pans, tiny labels, or a dense full-page recording at thumbnail size. The README's first media should communicate the premise even when animation is disabled. Media remains forthcoming until the final capture and render pass.

## User-directed refinement: readable graph and distinct panels

The subsequent user feedback prioritizes the graph as the main window, full readable course titles, visibly distinct panels, and a small overview map. These requirements supersede any earlier compact card treatment that clipped titles or made the graph secondary to a long inspector.

At widths of roughly 512–1050 px, use the full available width for the graph and move saved paths to a labeled drawer. A narrow desktop sidebar plus an inspector must not leave only a 300 px map. At a 612×824 viewport, a useful starting budget is a 56 px header, 76 px path context, 44 px tools, roughly 390 px graph, 90 px collapsed selected-course summary, and 64 px term strip. Adapt to content without shrinking course text. The default selected-course summary can open a details panel; it must not turn the initial screen into a long document beneath the graph.

Course nodes use a fixed 336×252, 4:3 landscape footprint. Full-width bold titles wrap without clamping, use 28/25/23 px according to length, and have no subject icons. Preserve space for the footer and large checked-circle control at the lower right above status text. Reset view uses 0.575 zoom; Focus provides a closer view. Long names must remain inside the same rectangle without bleeding into controls or edges.

Distinguish panels through structure: cool-slate canvas for the map, a white preview, a softly tinted saved-path surface, visible borders, and small gutters. Echo the selected node's outline accent in the preview's top edge and course-code chip. Do not flood entire panels with color or alter the meanings of cyan, violet, amber, and red.

Place the optional pannable/zoomable minimap at the upper-right of the graph beneath the map controls. It starts off, has square corners and a subtle border, and keeps a visible viewport outline and quiet outside mask. The labeled Minimap button toggles it; primary zoom controls remain at lower-left.

## User-directed refinement: satisfying selection and motion

A course selection should feel responsive, then stable. The selected card, inspector, and outgoing possibilities form one short sequence. Motion must explain the relationship, without suggesting eligibility that has not been established.

| Event | Timing | Treatment |
| --- | --- | --- |
| Hover/focus preview | About 100 ms | Gentle halo and directional relationship emphasis; no scaling |
| Pin a course | 160 ms response, settled by about 260 ms | Inner card lifts 2 px and scales to about 1.015, then settles; persistent 2 px outline and elevated shadow |
| Inspector switches pinned course | About 220 ms | Opacity and 8 px upward entrance, matching accent top edge and course-code chip |
| Prerequisite/downstream flow | 2.0–2.4 s cycle | Cyan moves toward the focused course; violet moves toward connected later courses |
| Downstream attention cue | One 320 ms pulse per selected course | A restrained glow, staggered 35 ms across at most five visible nodes |
| Missing connection | Static | Dashed red line and amber missing-course state; no successful-flow animation |

Use `cubic-bezier(.2,.8,.2,1)` for a quick response and soft settle. Animate the inner course card rather than React Flow's positioned wrapper. Allow only bounded neighborhood spreading on selection; preserve branch order and do not move focus unexpectedly or replay the inspector entrance on every passing hover. Available-button glow is subtle and honors reduced motion. A pinned course remains visibly selected while the pointer moves into its inspector.

When reduced motion is requested, disable transforms, pulses, directional dash motion, and animated panning. Retain static arrow direction, outlines, color, icons, and requirement text. The same choices and conclusions must be available without animation. The wording remains “possibilities” or “contributes toward,” not unconditional “unlocked.”

## User-directed refinement: parallel connection lanes

Parallel routes should suggest an orderly network rather than a tangle. Keep lane ordering deterministic from the layout positions; hover and selection must not rearrange it. Shared port fans use 6 px lane spacing with short departures and arrivals (about 18 px). Open spans use gentle curves when the entire curve clears the cards. Obstructed spans retain rounded corridors, with up to 40 px resting bends and 64 px selected bends, reduced where clearance requires. Ambient strokes stay thin and visible; selected strokes carry stronger emphasis.

Route corridors through nearby open space around the actual card bounds. A connection that skips a band does not automatically use an outer rail; take a short clear detour when needed. Preserve the same directional prerequisite and downstream colors. Selected lanes are crisp; background lanes stay quiet. Missing red connections remain dashed and static. Static arrowheads communicate direction when motion is disabled. The lane treatment must not hide the distinction between an alternative requirement and an additional mandatory course.

## Program goal and university identity

The course network grows from left to right through a wider, shallow rectangle. Course cards and calm connections carry the information; no large decorative backdrop is needed. The default Full map view and overview map reveal the overall shape, and the selected-course view preserves readable titles. Use simple MIT identification at the goal and restrained university accents across the interface. The product remains an independent prototype with partial data coverage.

Place the program goal to the right of the rendered courses as a large enamel crest, rather than another rectangular course card. The 640×760 node contains a 540×550 artwork area: a sculpted bronze rim and cardinal enamel unify four motifs—beacon star, branching circuits, ivory open book, and laurel. An integrated metal nameplate carries the program code. The full program name and kind remain beneath the artwork, followed immediately by the progress bar. The crest should retain approximately three to four times the earlier pin's apparent width in the whole-map overview; judge this in an actual screenshot, not only a close-up. Use restrained highlights, an occasional slow sheen, and small metal glints. It is original CourseGraph artwork, not an official university seal or an awarded credential. A compact companion pin remains in the review dialog; the separate header Program goal shortcut is removed. Reduced motion removes the moving sheen and glints.

Label the 0–100 bar **Mapped coursework**. Solid fill shows completed coverage; the lighter overlay shows cumulative completed-plus-valid-planned coverage, never their sum. Keep the two values explicit. Unknown and unmodeled requirements remain outside the numeric score, and 100% does not establish degree completion. A student's explicit advisor-review record adds a separate check medallion; it is not triggered by progress. That record remains their own statement, not institutional verification. Further study has separate advisor and admissions review.

Public MIT talks add a small optional source of curiosity near the program introduction. Keep speaker, subject, year, and source visible. A link opens only on request; it should not take over the map, autoplay, or become a recommendation feed. The curation and editorial program associations are documented in `INSPIRATION.md`.

The media storyboard in `media/STORYBOARD.md` uses the final left-to-right framing. Capture the actual graph and optional goal/inspiration panels after UI validation. Maintain the same clear missing-step repair story in the short loop. A completion emblem is not required for the demonstration and should never be manufactured as evidence of a completed academic program.

## User-directed refinement: an organic map with quieter connections

Course positions may float within their logical left-to-right progression bands, using deterministic attraction between related branches and guaranteed card clearance. The whole map remains bounded and retains branch order; selection may gently expand nearby spacing without reshuffling the progression. Route connections against the actual card rectangles rather than assuming aligned rows. A link that skips a logical layer takes a nearby clear corridor when one is available; it does not automatically travel around the entire map.

Keep shared port fans separated by 6 px. Rounded bends must remain outside the card interiors, including when the selected edge uses a larger radius. Ambient connections are thin and quiet; selected incoming, outgoing and missing connections retain their semantic colors and prominence. Geometry tests verify complete route polylines and sampled selected bends across the four program maps. These checks establish geometric clearance, while final screenshot review remains necessary to judge visual calm and readability.
