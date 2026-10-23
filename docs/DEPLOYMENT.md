# Public deployment

The prototype is publicly hosted at **https://coursegraph.my**, with **https://coursegraph-paths.rlze.chatgpt.site** as its platform address. The custom domain returned HTTP 200 over HTTPS on October 23, 2026, after the hosting provider confirmed active routing and TLS. The first platform publication also rendered the application in a fresh browser tab without a sign-in redirect.

The static application is built from `web/`, with output in `web/dist/`. There are no runtime secrets or database credentials in this prototype. Guest paths stay in the visitor's browser.

The Sites project ID is `appgprj_6adb849892d08191bf9dc2fcfb1fa83d`, recorded in `web/.openai/hosting.json`. Future publication must reuse that project and its public audience. The ignored `.site-stage/` checkout isolates Sites source synchronization from this GitHub repository. Short-lived publishing credentials must never be stored in the repository.

## coursegraph.my

The domain has been purchased and attached to the hosting project. All four DNS records were saved in Namecheap and verified in its refreshed DNS table on October 23, 2026. Routing and TLS are active.

In the Namecheap DNS zone for `coursegraph.my`, configure these records. Namecheap's Host column uses the short names below.

| Type | Host | Value |
| --- | --- | --- |
| A | `@` | `162.159.143.30` |
| A | `@` | `172.66.3.26` |
| TXT | `_openai-site-verification` | `openai-site-verification=b5oDz9BNOLcJUuTcy5q2b6qpoqIK8fsvJK0gCipwgWA` |
| TXT | `_cf-custom-hostname` | `6471ca61-9807-478b-9790-acf40467aa1b` |

These are the exact records returned by the hosting service for this domain binding. The refreshed host table contains these four records without the previous parking/redirect entries. Mail settings were preserved. Browser access is now working; no further site-permission change is needed.

Verification completed: custom-domain status, provider status, and TLS status are all `active`; `https://coursegraph.my` returned the CourseGraph HTML with HTTP 200. Both addresses remain usable.

## Alternative static deployment

For a Vercel project, use repository `Stephenitis/CourseGraph`, branch `master`, root directory `web`, build command `npm run build`, and output directory `dist`. This repository is compatible with that configuration; no Vercel project was created by this build chat. The existing public deployment uses Sites.

## Latest release and future workflow

The latest app was merged through [PR #5](https://github.com/Stephenitis/CourseGraph/pull/5) into master at `7d85932` (app source head `b9d28ade0ca682b7d95f8ea4a5fbf93334869b67`). Sites version **4** deployed successfully on October 23, 2026 at 20:32:28 UTC:

- Source commit: `3f10b1f76ea3133e88a5bbda67e5148785f65d5f`
- Version: `appgprj_6adb849892d08191bf9dc2fcfb1fa83d~appgver_b3eff196c8e4819189227156d68f0cee`
- Deployment: `appgdep_6adbc45515c88191a6ed1ace22d33084`
- Verified public entry assets: `index-DK-S8VrF.js` and `index-BzJ0wVyw.css`
- Checks: 35 focused layout/routing/appearance/camera tests; production TypeScript/Vite build. Final bundling took 1.50 seconds; Sites reused that output.

Stephen’s standing instruction is **test → build → push → merge to master → deploy**. GitHub and Sites remain separate steps; no automatic GitHub-to-Sites deployment pipeline is installed. Documentation-only updates do not require an unchanged app deployment. Use [HANDOFF.md](HANDOFF.md) and the installed Sites skill for the release process, and preserve the current public audience and project.

Both GitHub and Sites source uploads initially encountered Git RPC HTTP 400. Setting repository-local `http.postBuffer` to `524288000` and `http.version` to `HTTP/1.1` resolved the observed errors. Do not treat a transport error as a successful upload; verify the remote commit and deployed assets.
