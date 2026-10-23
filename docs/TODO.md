# CourseGraph TODO

Status: October 23, 2026. The latest app is merged to master and live at [coursegraph.my](https://coursegraph.my/). See [HANDOFF.md](HANDOFF.md) for architecture, release details and operating instructions.

## Media — deferred at Stephen's request

Do not start additional capture or rendering until asked to resume. Existing files in `docs/media` are historical/interim references, not a final matching screenshot set.

- [ ] Capture one approved build consistently: overview, prerequisites, missing requirement, the same example resolved, saved paths, and timeline. Preserve user plans; use an explicitly separate demo path/origin.
- [ ] Produce the 52-second school-facing explainer MP4.
- [ ] Produce the 10.8-second README wow loop as a 1080p MP4 and optimized 1200 px GIF, plus poster, captions and a source/build manifest.
- [ ] Inspect every designed still and final transition; verify readable warnings, honest feature claims, duration, dimensions, playback and download size.
- [ ] Replace draft references with the approved screenshots and embed the final GIF in README. Add video links only after the files exist and work.

Preparation exists in [STORYBOARD.md](media/STORYBOARD.md) and `scripts/render_demo.py`. No final films have been rendered.

## Completed graph refinement

- [x] Directional geometric lattice and stable layered ordering with virtual long-edge vertices, visible grey pipes, obstacle-aware curves, persistent chosen paths, and dotted available options.
- [x] Full-map first load, blank-click 0.4 zoom, and drag-to-zoom Select window.
- [x] Full-major visual preview on load, with Show my path and course inspection returning to saved choices; preserve all existing local plans.

## Idea 2 iteration

- [x] Add isolated `/idea2` unlock-board prototype with empty requirement slots.
- [ ] Gather feedback on course-first versus requirements-first emphasis; see [IDEA2.md](IDEA2.md).

## Product work requiring a future scope decision

- [ ] Add authenticated accounts and cross-device saving if desired. Supabase was discussed but is not connected. Stephen explicitly deferred persistence again on October 23: keep this a demo prototype. Preserve/export local plans before any migration.
- [ ] Ingest validated term-specific sections and meeting times, then connect the existing conflict engine to selected sections. Keep Schedule unverified until that data is present.
- [ ] Expand and verify major/minor/MEng requirements, GIRs, electives, equivalencies, transfer credit and overlapping-degree allocation with advisors. Keep modeled progress distinct from certification.
- [ ] Validate the experience with real students and advisors, including a teenage prospective-student walkthrough. The existing persona review is not actual user research.
- [ ] Complete a focused mobile, keyboard/screen-reader, reduced-motion and all-theme review against the final interface.
- [ ] Add catalog adapters and verified program rules for other schools if wanted. The current school selector changes appearance only.
- [ ] Consider a real comparison view for saved paths. Current comparison is by switching between paths.
- [ ] When feature work resumes, reduce accumulated CSS overrides and split App.tsx into focused components without changing approved behavior.

## Release routine

For app changes, Stephen's standing instruction is **test → build → push → merge to master → deploy**. Respect checks and branch protections. Keep GitHub and Sites publication explicitly separate; no automatic deployment workflow has been installed. Documentation-only changes need accuracy, link and whitespace checks rather than an unchanged app deployment.

Keep using Export for backups. Localhost, different ports and the public domain have separate browser storage.
