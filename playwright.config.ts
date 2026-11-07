import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: { command: 'pnpm run build && pnpm run preview', port: 4173 },
	use: {
		// Production builds are served under the GitHub Pages base path.
		baseURL: 'http://localhost:4173/scoreme/'
	},
	testMatch: '**/*.e2e.{ts,js}',
	forbidOnly: !!process.env.CI,
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list'
});
