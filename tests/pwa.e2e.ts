import { expect, test, type Page } from '@playwright/test';

async function waitForServiceWorker(page: Page) {
	await page.goto('');
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
		if (navigator.serviceWorker.controller) return;
		await new Promise((resolve) =>
			navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true })
		);
	});
}

test('publishes an installable web app manifest', async ({ page, request }) => {
	await page.goto('');
	const href = await page.locator('link[rel="manifest"]').getAttribute('href');
	const manifestUrl = new URL(href!, page.url());
	const response = await request.get(manifestUrl.href);
	expect(response.ok()).toBe(true);

	const manifest = await response.json();
	expect(manifest).toMatchObject({ name: 'scoreme', display: 'standalone' });
	expect(new URL(manifest.start_url, manifestUrl).pathname).toBe('/scoreme/');
	expect(new URL(manifest.scope, manifestUrl).pathname).toBe('/scoreme/');

	const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
	expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
	for (const icon of manifest.icons) {
		const iconResponse = await request.get(new URL(icon.src, manifestUrl).href);
		expect(iconResponse.ok(), icon.src).toBe(true);
		expect(iconResponse.headers()['content-type']).toBe(icon.type);
	}
});

test('registers a service worker scoped to the base path', async ({ page }) => {
	await waitForServiceWorker(page);
	const scope = await page.evaluate(
		async () => (await navigator.serviceWorker.getRegistration())?.scope
	);
	expect(scope).toBe('http://localhost:4173/scoreme/');

	const caches = await page.evaluate(() => globalThis.caches.keys());
	expect(caches).toEqual([expect.stringMatching(/^scoreme:\/scoreme:/)]);
});

test('keeps a saved game when reloaded offline', async ({ page, context }) => {
	await waitForServiceWorker(page);
	await page.getByLabel('Player 1 name').fill('Greer');
	await page.getByLabel('Greer score, round 2', { exact: true }).fill('8');
	await expect
		.poll(() => page.evaluate(() => localStorage.getItem('scoreme:/scoreme')))
		.toContain('Greer');

	await context.setOffline(true);
	await page.reload();
	await expect(page.getByLabel('Player 1 name')).toHaveValue('Greer');
	await expect(page.getByLabel('Greer score, round 2', { exact: true })).toHaveValue('8');
	await expect(page.getByLabel('Greer total', { exact: true })).toHaveText('8');
});

test('works offline once loaded', async ({ page, context }) => {
	await waitForServiceWorker(page);

	await context.setOffline(true);
	await page.reload();
	await expect(page).toHaveTitle('Score');
	await expect(page.locator('tbody tr')).toHaveCount(13);

	await page.getByLabel('P1 score, round 2', { exact: true }).fill('5');
	await expect(page.getByLabel('P1 total', { exact: true })).toHaveText('5');
});

test('never serves version.json from the cache', async ({ page, context }) => {
	await waitForServiceWorker(page);
	expect(
		await page.evaluate(async () => (await fetch('version.json', { cache: 'no-store' })).ok)
	).toBe(true);

	await context.setOffline(true);
	const offline = await page.evaluate(() =>
		fetch('version.json', { cache: 'no-store' }).then(
			() => 'served',
			() => 'failed'
		)
	);
	expect(offline).toBe('failed');
});
