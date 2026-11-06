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
pnpm check   # svelte-check / TypeScript
pnpm lint    # prettier + eslint
pnpm format  # prettier --write
pnpm test    # Playwright end-to-end tests (run `pnpm exec playwright install chromium` once first)
```

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
