# Lotus365 assignment replica

A Next.js App Router replica of the captured public pages at https://lottuss365.co/. Reference markup and styles are sanitized and served locally. Original scripts and source form actions do not run.

## Run locally

```sh
npm install
npm run dev -- --hostname localhost --port 3000
```

Open http://localhost:3000/. Read the installed Next.js guides under node_modules/next/dist/docs/ before changing framework behavior.

## Deploy on Vercel

Import `kabirr6044/lotus365` into Vercel and use the detected Next.js framework settings. No `vercel.json` or Docker build is required. Vercel builds with `npm run build`; standalone output remains enabled only for non-Vercel builds such as Docker.

The primary SEO origin is `https://llotuss365.com`. Canonicals, Open Graph URLs, robots.txt and sitemap URLs use this domain even when a page is served on a Vercel or Render hostname. `SITE_URL` can override the origin if the primary domain changes. Add `llotuss365.com` in Vercel's Domains settings and use the DNS records Vercel provides in GoDaddy. Configure `www.llotuss365.com` and the Vercel hostname to redirect to the primary non-www domain where supported. Do not submit the sitemap until the domain resolves to the deployment. If you override `SITE_URL`, use the full HTTPS origin and redeploy.

Main content and blog pagination are indexable on a configured public production origin. Tag, category and copied-author archives use `noindex, follow` and are excluded from the sitemap. Local/unconfigured builds and Vercel preview/development/custom environments use noindex, an empty sitemap and robots disallow-all. Production robots allows crawling, including archives so crawlers can see their noindex. Unknown pages keep Next.js's 404/noindex behavior.

After deployment, verify `/robots.txt`, `/sitemap.xml` and the homepage canonical/indexing metadata. Submit the sitemap in Search Console. Changing `SITE_URL` requires a new build because the pages and sitemap are statically generated. Existing page copy and visual layout are preserved; content rewrites and candidate article merges from the SEO plan are separate work.

## Deploy on Render

Create a Blueprint in Render and connect `kabirr6044/lotus365`. The root `render.yaml` configures a free Docker web service on `main`. The multi-stage `Dockerfile` uses Node.js 22, installs locked dependencies, builds Next.js, and runs its standalone server as a non-root user. The server binds to `0.0.0.0` using Render's `PORT` (default 10000). The homepage is the health check.

No environment values are required for the first deployment. External links remain inactive until you add `NEXT_PUBLIC_DESTINATION_URL` under the service's Environment settings. Use Save, rebuild, and deploy after setting or changing that public variable; restarting alone will not update the browser bundle. This variable is intentionally not managed by the Blueprint so later syncs preserve your dashboard setting.

The sitemap and canonicals use `https://llotuss365.com` by default. Add the domain to the chosen hosting service and configure its DNS before launch. If the primary domain changes, set `SITE_URL` and rebuild. The Dockerfile declares build arguments for the site origin and destination variable so Render can supply them during the image build. No database or persistent disk is needed.

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

Content checks cover every route, local styles/assets, 108 redirect forms, and 465 shared-destination external references. Destination tests cover missing or unsafe URLs and exact destination preservation. SEO tests cover canonical origins, preview protection, archive indexing, pagination and sitemap selection.

Final checks: destination tests and the all-route content audit pass. Browser checks confirmed signup/login validation and redirect, and the shared external destination. All 407 pages were compared at desktop, 390×844, and 768×1024; eight representative pages were also compared at 360×800 and 1024×768. Local images now load eagerly to preserve intrinsic dimensions before scrolling. Older geometry records predate this image-loading correction.
The final production build passes. The preview runs with `npm run start -- --hostname localhost --port 3000`, with no configured external destination. Login button line height and inline layout match the original link styling.

Main page titles retain the captured reference wording. Pagination metadata now includes the page number. The original 32×32, 192×192, and Apple touch favicons are downloaded locally and included on every page.

Docker verification before the SEO update: the Linux image built and ran as UID 1000; checks covered 407 pages and 462 local assets/styles/icons. The SEO sitemap now contains 157 production URLs, excluding 250 archives; local and preview sitemaps are empty.
