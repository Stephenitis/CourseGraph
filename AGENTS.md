# CourseGraph working instructions

- Read `docs/HANDOFF.md` and `docs/TODO.md` before resuming substantial work. The runnable app is in `web/`; preserve the legacy Rails source.
- Stephen's standing instruction (October 23, 2026): for completed app changes, run appropriate tests, build, upload to GitHub, merge to **master**, and deploy the latest app. Do not repeatedly ask permission for this workflow. Respect failing checks, branch protections, conflicts, and any newer user instructions; never force-push or bypass safeguards.
- GitHub and hosting are separate release steps. Production uses the existing public Sites project and `coursegraph.my`, not Vercel. A merge alone does not publish the site.
- Keep all media production on the TODO list until Stephen asks to resume it. Existing captures are historical/interim; do not claim finished videos or start fresh captures/renders as routine follow-up.
- Preserve saved paths and local browser storage. Never clear user plans to obtain clean screenshots or test states. Export/Import is the current backup and migration mechanism.
- Use Node 24 (Node 22+ supported). From the root: `npm --prefix web test`, `python3 web/scripts/test_ingest_mit.py`, and `npm --prefix web run build`. Documentation-only changes need link/accuracy/whitespace checks, not an unchanged app rebuild.
- Keep credentials out of source, command arguments, logs, and documentation. Sites write credentials are short-lived and must be passed through the supported hidden-stdin workflow.
- Preserve the latest design decisions in the handoff: 4:3 cards without subject icons, white/blue/purple/charcoal curriculum colors, yellow focused locked cards, 0.575 reset zoom, below-map preview, sidebar navigation, and no Search or Autofill UI.
