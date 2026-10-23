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

The latest app was merged through [PR #3](https://github.com/Stephenitis/CourseGraph/pull/3) into master at `709ebf0` (app source head `f6a697dea0fbac17e13bb20b5f55aead2286032a`). Sites version **3** deployed successfully on October 23, 2026 at 20:23:26 UTC:

- Source commit: `b20fc32d96e2afd0502015a3f6050449b6f5bc37`
- Version: `appgprj_6adb849892d08191bf9dc2fcfb1fa83d~appgver_f608573b1be4819197b737be7d4c18fc`
- Deployment: `appgdep_6adbc235fd58819193efca6648d27da6`
- Verified public entry assets: `index-plE_p7h3.js` and `index-BzJ0wVyw.css`
- Checks: 32 focused layout/routing/appearance/camera tests; production TypeScript/Vite build. Final bundling took 1.68 seconds; Sites reused that output.

Stephen’s standing instruction is **test → build → push → merge to master → deploy**. GitHub and Sites remain separate steps; no automatic GitHub-to-Sites deployment pipeline is installed. Documentation-only updates do not require an unchanged app deployment. Use [HANDOFF.md](HANDOFF.md) and the installed Sites skill for the release process, and preserve the current public audience and project.

Both GitHub and Sites source uploads initially encountered Git RPC HTTP 400. Setting repository-local `http.postBuffer` to `524288000` and `http.version` to `HTTP/1.1` resolved the observed errors. Do not treat a transport error as a successful upload; verify the remote commit and deployed assets.
