# Lotus365 assignment replica

A Next.js App Router replica of the captured public pages at https://lottuss365.co/. Reference markup and styles are sanitized and served locally. Original scripts and source form actions do not run.

## Run locally

```sh
npm install
npm run dev -- --hostname localhost --port 3000
```

Open http://localhost:3000/. Read the installed Next.js guides under node_modules/next/dist/docs/ before changing framework behavior.

## Deploy on Render

Create a Blueprint in Render and connect `kabirr6044/lotus365`. The root `render.yaml` configures a free Docker web service on `main`. The multi-stage `Dockerfile` uses Node.js 22, installs locked dependencies, builds Next.js, and runs its standalone server as a non-root user. The server binds to `0.0.0.0` using Render's `PORT` (default 10000). The homepage is the health check.

No environment values are required for the first deployment. External links remain inactive until you add `NEXT_PUBLIC_DESTINATION_URL` under the service's Environment settings. Use Save, rebuild, and deploy after setting or changing that public variable; restarting alone will not update the browser bundle. This variable is intentionally not managed by the Blueprint so later syncs preserve your dashboard setting.

The sitemap uses Render's automatic `RENDER_EXTERNAL_URL`. If you add a custom domain, set `SITE_URL` to its full HTTPS URL and rebuild. The Dockerfile declares build arguments for these URLs and the destination variable so Render can supply them during the image build. No database or persistent disk is needed.

If creating a Web Service manually instead of using a Blueprint, select Docker, use `./Dockerfile` with build context `.`, and leave the Docker Command override empty to use the image's `CMD`.

To build and run locally:

```sh
docker build -t lotus365 .
docker run --rm -p 3000:10000 lotus365
```

Supply `--build-arg NEXT_PUBLIC_DESTINATION_URL=https://your-destination.example/` when building if you want to activate external links. Runtime-only changes cannot update the already built browser bundle. `.dockerignore` excludes local environment files, dependencies, generated builds, raw captures, and audit reports from the image build context.

See [Docker on Render](https://render.com/docs/docker) and the [Blueprint reference](https://render.com/docs/blueprint-spec).

## Shared destination URL

Copy `.env.example` to `.env.local` and later set:

```env
NEXT_PUBLIC_DESTINATION_URL=https://your-destination.example/
```

Every external link and validated form, including login and signup, uses this single URL. Internal navigation stays local. With an empty URL, external links remain inactive and submitting a valid form shows a pending-destination message. Restart development after setting it; rebuild production because public environment variables are embedded at build time.

Forms use browser validation and then navigate directly. They do not read, store, submit, or append field values to the destination. There is no database, submission API, authentication, or OTP integration. Button labels and casing mirror the reference, including GET OTP, while the actual behavior is a redirect without any OTP service. The destination is a public URL, not a secret.

EXTERNAL_LINKS.md and data/external-links.json retain the original external URLs, labels, and originating pages as references. Those original URLs are never used for outbound navigation.

## Content and styling

- 407 captured public pages, the original registration alias, and a local sitemap.
- 336 local mapped assets, including images and six Poppins font files, plus a local snapshot of the reference unavailable-video graphic.
- Each page loads its own ordered stylesheet bundle, preserving the reference CSS cascade and removing it on navigation.
- Invisible source script positions are retained as hidden, inert elements so sibling and last-child spacing rules still match.
- scripts/prepare-content.py rebuilds sanitized page data from saved captures. It requires Python with lxml. Generated JSON is replaced atomically to avoid partial reads by the development server.
- data/visual-audit-after.json records desktop style comparisons. data/responsive-content-audit.json records phone/tablet styles and case-sensitive text comparisons. Forms are excluded from the body-text comparison; their original labels are preserved. These audits record geometry differences as well as style comparisons and are not a pixel-perfect certification.

## Verification

```sh
npm test
npm run check:content
npm run build
```

Content checks cover every route, local styles/assets, 108 redirect forms, and 465 shared-destination external references. Destination tests cover missing or unsafe URLs and exact destination preservation. The replica is marked noindex for the assignment.

Final checks: destination tests and the all-route content audit pass. Browser checks confirmed signup/login validation and redirect, and the shared external destination. All 407 pages were compared at desktop, 390×844, and 768×1024; eight representative pages were also compared at 360×800 and 1024×768. Local images now load eagerly to preserve intrinsic dimensions before scrolling. Older geometry records predate this image-loading correction.
The final production build passes. The preview runs with `npm run start -- --hostname localhost --port 3000`, with no configured external destination. Login button line height and inline layout match the original link styling.

Page titles match all 407 captured reference titles. The original 32×32, 192×192, and Apple touch favicons are downloaded locally and included on every page; generated production metadata and served icon files were verified.

Docker verification: the Linux image builds successfully and runs as UID 1000. Container checks passed for all 407 pages, 462 local assets/styles/icons, and the 407-entry sitemap.
