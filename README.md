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

The site is published with GitHub Pages from the `docs/` folder at https://njs50.github.io/scoreme/.

```bash
pnpm build
```

writes the static site to `docs/` with the `/scoreme` base path. Commit the updated `docs/` folder to publish it. `pnpm preview` serves the build locally at http://localhost:4173/scoreme/.
