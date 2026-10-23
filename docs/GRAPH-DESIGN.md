# Continuous constellation — October 23, 2026

The map is a visible network before inspection, with a persistent saved route and a dotted frontier. Course cards retain their sourced curriculum colors. This is a demo prototype; Supabase and shared persistence remain deferred.

## Research and decisions

[GDKeys: Keys to Meaningful Skill Trees](https://gdkeys.com/keys-to-meaningful-skill-trees/) emphasizes meaningful choices, personal specialization, and showing future possibilities. Applied here: keep the whole network visible, preserve the user's chosen route while inspecting another branch, and distinguish an available option from a completed choice. Academic plans retain reversible decisions; no game-style respec penalty is appropriate.

[ELK's layered algorithm documentation](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html) describes the Sugiyama sequence: layering, crossing minimization, then placement and routing. We use those principles within the existing deterministic layout, without adding an asynchronous layout dependency. This is a heuristic, not a guarantee of the global minimum crossing count.

[yWorks layered graph layout](https://www.yworks.com/pages/layered-graph-layout) reinforces separating rank assignment, crossing reduction, and coordinate/routing decisions. The directional lattice replaces the exploratory free hexagonal board; forward prerequisite progression is now a hard constraint.

## Geometry

1. Collapse strongly connected prerequisite/corequisite components before ranking. Respect curriculum progression and dependency order.
2. Insert temporary virtual vertices for long connections. Run 12 alternating normalized-barycenter sweeps. Retain the best ordering lexicographically by crossing count, then travel. Virtual vertices are never displayed as courses or requirements.
3. Place fixed 4:3 cards in hard left-to-right dependency columns. Center each column symmetrically on a shared vertical lattice with 180px card clearance. Size horizontal pitch from the widest layer, aiming for at least a 2.6:1 course field. Sparse columns retain open routing space. Inspection does not move the cards.
4. Assign source and destination lanes consistently. Prefer horizontal runs with repeated 30/60-degree diagonals, including paired diagonal runs through invisible routing waypoints. Choose the shortest clear candidate within bounded outer rails. Where these motifs are blocked, use local corridors or a Euclidean visibility graph around padded card corners, with distance plus a bend penalty. Retain the orthogonal obstacle router as a fallback. Waypoints never alter requirement semantics.
5. Prove quadratic bends clear by recursive subdivision; shrink unsafe bends. Route all states with the same geometry. Memoize curves across viewport updates.
6. Include actual route points and the degree goal in overview bounds. Screen-compensated stroke widths keep pipes visible at overview scale.

## Visual semantics

- Grey: catalog connection, always visible.
- Teal solid with glow: chosen endpoints connected in valid temporal order, with a completed or locally eligible source. This is a contribution, not certification of the entire destination requirement.
- Violet dotted: an available next choice from a chosen course, or an available previous option feeding a chosen/inspected course. Availability uses the current plan and relevant term.
- Red dashed: an inspected unmet prerequisite option; alternatives remain alternatives.
- Subtle light particles travel along chosen paths; reduced-motion preferences hide them.

## Navigation and first load

First load fits the complete graph. Newly initialized demos have a partially filled computing/math route with programming preparation and later courses placed in successive semesters. Existing saved plans are never replaced.

Full map always fits every card and connection, and stays in that camera mode until another explicit action. Clicking blank space switches to 0.4 browsing zoom. Clicking a course inspects and focuses it without changing the plan. The check button adds/removes courses with existing dependency confirmation and Undo.

Select window replaces Focus. It fits the graph, then provides a pointer/touch rectangle; drags under 16 pixels are ignored. Release fits the selected area, capped at 1.4. Escape or Cancel exits selection. Reset view retains the 0.575 preset. Native zoom/pan controls remain available.

## Verification and release speed

Run the changed layout, routing, connection-state, and camera suites (32 focused checks, approximately 1–2 seconds on the development machine). Routing checks cover all four MIT programs and sample the rendered 120px-radius curves against every card. Build once after final changes and reuse that `dist` in Sites packaging; do not rerun a successful unchanged build. No importer/data rules changed, so importer tests were skipped for this release at Stephen's request. The full test command remains available for broader domain changes.

Browser checks cover whole-map bounds, stable chosen edges during inspection, blank-click zoom, rectangle zoom, and cancellation. Media/video production remains deferred; browser inspection is development QA only.
