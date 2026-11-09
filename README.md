# scoreme

Simple score card for whatever bastardized variant of gin we play.

Built with SvelteKit and Svelte 5. Requires Node 22.17+ and pnpm (pinned via `packageManager`, so `corepack enable` will pick the right version).

## Developing

Install dependencies and start a development server:

```bash
pnpm install
pnpm dev

# or start the server and open the app in a new browser tab
pnpm dev --open
```

Other useful scripts:

```bash
pnpm check          # svelte-check / TypeScript (app and service worker)
pnpm lint           # prettier + eslint
pnpm format         # prettier --write
pnpm test:unit      # Vitest: unit tests (Node) and component tests (Chromium)
pnpm test:coverage  # the same, with coverage thresholds enforced
pnpm test:e2e       # Playwright against the production build
pnpm test           # unit/component, then end-to-end
```

Tests need Chromium once: `pnpm exec playwright install chromium`. CI (`.github/workflows/ci.yml`) runs all of the above on every pull request and push to `main`.

## Building and deploying

Pushes to `main` are deployed by `.github/workflows/deploy-pages.yml`. The workflow builds the site and force-pushes it to the `gh-pages` branch, which GitHub Pages serves at https://njs50.github.io/scoreme/. Nothing built is committed to `main`.

To build locally:

```bash
pnpm build
```

writes the static site to `docs/` (git-ignored) with the `/scoreme` base path, plus a `version.json` containing the commit SHA. `pnpm preview` serves that build locally at http://localhost:4173/scoreme/.

## Preview deploys

Pushes to any branch other than `main` are built by `.github/workflows/preview-deploy.yml` and force-published to https://njs50.github.io/scoreme-preview/ (repo `njs50/scoreme-preview`, branch `gh-pages`). The last branch to push wins. The preview build uses base path `/scoreme-preview` and shows a branch/SHA watermark. Production stays on `/scoreme` with no watermark.

That repo and the `SCOREME_PREVIEW_PAT` secret are created by hand; the workflow file lists the steps. After a push, poll https://njs50.github.io/scoreme-preview/version.json until `sha` matches the commit.

## Offline / installable app

scoreme is a PWA with no runtime dependencies. The manifest comes from `vite/webManifest.ts`. The hand-written service worker is in `src/service-worker/`; its caching rules are in `src/lib/serviceWorkerPolicy.ts`. The worker precaches the build, serves hashed `_app/immutable` files from the cache, and goes to the network first for everything else, falling back to the cache when offline. It never caches `version.json`. While the app is open it compares that file with the commit it was built from, about once a minute and whenever the app is shown again. A newer commit puts a "Click here to update" bar across the top; the saved game is still there after the reload. Cache names include the base path, so production and preview, which share the `njs50.github.io` origin, never touch each other's caches.

The current game is written to `localStorage` on each edit (`src/lib/savedGame.ts`), so a reload or the phone closing the app keeps the names and scores. The storage key includes the base path too, and production and preview keep separate games. The refresh icon in the totals corner clears the saved sheet after a confirmation. The sheet stretches to fill the screen and scrolls sideways once a column would be too narrow for a three-digit score.

Icons are rendered from `static/icons/icon.svg` with `pnpm icons` (uses Playwright's Chromium); commit the regenerated PNGs.
