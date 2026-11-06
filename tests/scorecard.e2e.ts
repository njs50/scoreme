import { expect, test } from '@playwright/test';

test('has a row for each round from 2 to A', async ({ page }) => {
	await page.goto('');
	const labels = page.locator('tbody td.round');
	await expect(labels).toHaveText([
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9',
		'10',
		'J',
		'Q',
		'K',
		'A'
	]);
});

test('totals each player and adds players', async ({ page }) => {
	await page.goto('');
	const totals = page.locator('tfoot td.pcol');
	await expect(totals).toHaveText(['0', '0']);

	const rows = page.locator('tbody tr');
	await rows.nth(0).locator('input').nth(0).fill('5');
	await rows.nth(1).locator('input').nth(0).fill('10');
	await rows.nth(0).locator('input').nth(1).fill('7');
	await expect(totals).toHaveText(['15', '7']);

	await page.locator('thead td.round').click();
	const names = page.locator('thead input');
	await expect(names).toHaveCount(3);
	await expect(names.nth(2)).toHaveValue('P3');
	await rows.nth(2).locator('input').nth(2).fill('3');
	await expect(totals).toHaveText(['15', '7', '3']);
});

test('publishes the build SHA', async ({ request }) => {
	const body = await request.get('version.json').then((res) => res.json());
	expect(body.sha).toBeTruthy();
	expect(body.builtAt).toBeTruthy();
});

test('player names can be edited', async ({ page }) => {
	await page.goto('');
	const name = page.locator('thead input').first();
	await name.fill('Greer');
	await expect(name).toHaveValue('Greer');
});
