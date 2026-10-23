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

For a Vercel project, use repository `Stephenitis/CourseGraph`, branch `prototype/coursegraph`, root directory `web`, build command `npm run build`, and output directory `dist`. This repository is compatible with that configuration; no Vercel project was created by this build chat. The existing public deployment uses Sites.
