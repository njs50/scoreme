import { expect, test } from '@playwright/test';

const score = (page: import('@playwright/test').Page, player: string, round: string) =>
	page.getByLabel(`${player} score, round ${round}`, { exact: true });
const total = (page: import('@playwright/test').Page, player: string) =>
	page.getByLabel(`${player} total`, { exact: true });

test('serves the scorecard from the production base path', async ({ page }) => {
	await page.goto('');
	await expect(page).toHaveURL(/\/scoreme\/$/);
	await expect(page).toHaveTitle('Score');
	await expect(page.locator('tbody tr')).toHaveCount(13);
	await expect(page.locator('.preview-watermark')).toHaveCount(0);
});

test('keeps a running total while playing a game', async ({ page }) => {
	await page.goto('');

	await page.getByRole('button', { name: 'Add player' }).click();
	await page.getByLabel('Player 1 name').fill('Greer');

	await score(page, 'Greer', '2').fill('5');
	await score(page, 'Greer', '3').fill('10');
	await score(page, 'P2', '2').fill('7');
	await score(page, 'P3', 'A').fill('3');

	await expect(total(page, 'Greer')).toHaveText('15');
	await expect(total(page, 'P2')).toHaveText('7');
	await expect(total(page, 'P3')).toHaveText('3');
});

test('typing into a filled cell replaces its score', async ({ page }) => {
	await page.goto('');
	const cell = score(page, 'P1', '2');
	await cell.fill('12');
	await page.keyboard.press('Tab');

	await cell.click();
	await page.keyboard.type('4');

	await expect(cell).toHaveValue('4');
	await expect(total(page, 'P1')).toHaveText('4');
});

test('Escape leaves the cell', async ({ page }) => {
	await page.goto('');
	const cell = score(page, 'P1', '2');
	await cell.click();
	await expect(cell).toBeFocused();

	await page.keyboard.press('Escape');

	await expect(cell).not.toBeFocused();
});

test('asks before a reload throws away the scores', async ({ page }) => {
	await page.goto('');
	await score(page, 'P1', '2').fill('5');

	const dialog = page.waitForEvent('dialog');
	const reload = page.reload();
	const prompt = await dialog;
	expect(prompt.type()).toBe('beforeunload');
	await prompt.accept();
	await reload;
});

test('reloads an empty sheet without asking', async ({ page }) => {
	await page.goto('');
	await page.getByLabel('Player 1 name').fill('Greer');
	const dialogs: string[] = [];
	page.on('dialog', (d) => {
		dialogs.push(d.type());
		void d.accept();
	});

	await page.reload();

	await expect(page.getByLabel('Player 1 name')).toHaveValue('P1');
	expect(dialogs).toEqual([]);
});

test('publishes the build SHA', async ({ request }) => {
	const body = await request.get('version.json').then((res) => res.json());
	expect(body.sha).toBeTruthy();
	expect(body.builtAt).toBeTruthy();
});
