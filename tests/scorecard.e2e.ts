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

test('keeps the game across a reload without asking', async ({ page }) => {
	await page.goto('');
	await page.getByRole('button', { name: 'Add player' }).click();
	await page.getByLabel('Player 1 name').fill('Greer');
	await score(page, 'Greer', '2').fill('5');
	await expect
		.poll(() => page.evaluate(() => localStorage.getItem('scoreme:/scoreme')))
		.toContain('Greer');

	const dialogs: string[] = [];
	page.on('dialog', (dialog) => {
		dialogs.push(dialog.type());
		void dialog.accept();
	});
	await page.reload();

	await expect(page.getByLabel('Player 1 name')).toHaveValue('Greer');
	await expect(page.getByLabel('Player 3 name')).toHaveValue('P3');
	await expect(score(page, 'Greer', '2')).toHaveValue('5');
	await expect(total(page, 'Greer')).toHaveText('5');
	expect(dialogs).toEqual([]);
});

test('asks before a reload when the game cannot be saved', async ({ page }) => {
	await page.addInitScript(() => {
		const storage = Object.getPrototypeOf(localStorage) as Storage;
		const setItem = storage.setItem;
		storage.setItem = function (this: Storage, key: string, value: string) {
			if (this === localStorage) throw new DOMException('quota', 'QuotaExceededError');
			return setItem.call(this, key, value);
		};
	});
	await page.goto('');
	await score(page, 'P1', '2').fill('5');

	const dialog = page.waitForEvent('dialog');
	const reload = page.reload();
	const prompt = await dialog;
	expect(prompt.type()).toBe('beforeunload');
	await prompt.accept();
	await reload;

	await expect(score(page, 'P1', '2')).toHaveValue('');
});

test('clears the saved game after confirmation', async ({ page }) => {
	await page.goto('');
	await page.getByLabel('Player 1 name').fill('Greer');
	await page.getByRole('button', { name: 'Add player' }).click();
	await score(page, 'Greer', '2').fill('5');

	page.once('dialog', (dialog) => {
		expect(dialog.type()).toBe('confirm');
		void dialog.dismiss();
	});
	await page.getByRole('button', { name: 'New game' }).click();
	await expect(score(page, 'Greer', '2')).toHaveValue('5');

	page.once('dialog', (dialog) => {
		void dialog.accept();
	});
	await page.getByRole('button', { name: 'New game' }).click();
	await expect(page.getByLabel('Player 1 name')).toHaveValue('P1');
	await expect(page.getByLabel('Player 3 name')).toHaveCount(0);
	await expect(score(page, 'P1', '2')).toHaveValue('');

	const dialogs: string[] = [];
	page.on('dialog', (dialog) => {
		dialogs.push(dialog.type());
		void dialog.accept();
	});
	await page.reload();
	await expect(page.getByLabel('Player 1 name')).toHaveValue('P1');
	await expect(score(page, 'P1', '2')).toHaveValue('');
	expect(dialogs).toEqual([]);
});

test('fills the viewport and scrolls sideways once a score cannot fit', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 800 });
	await page.goto('');

	const sheet = page.locator('section');
	const table = page.locator('table');
	await expect(table).toBeVisible();
	const before = await table.boundingBox();
	const viewport = page.viewportSize();
	expect(before!.height).toBeGreaterThan(viewport!.height * 0.9);
	expect(before!.width).toBeGreaterThan(viewport!.width * 0.9);
	const rowHeights = await page
		.locator('tbody tr')
		.evaluateAll((rows) => rows.map((row) => row.getBoundingClientRect().height));
	expect(Math.max(...rowHeights) - Math.min(...rowHeights)).toBeLessThan(1);
	expect(await sheet.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);

	const add = page.getByRole('button', { name: 'Add player' });
	for (let i = 0; i < 8; i++) await add.click();
	const cell = score(page, 'P1', '2');
	await cell.fill('999');

	expect(await sheet.evaluate((node) => node.scrollWidth > node.clientWidth + 1)).toBe(true);
	const fits = await cell.evaluate((input) => input.scrollWidth <= input.clientWidth + 1);
	expect(fits).toBe(true);

	const [addBox, resetBox] = await Promise.all([
		page.getByRole('button', { name: 'Add player' }).boundingBox(),
		page.getByRole('button', { name: 'New game' }).boundingBox()
	]);
	expect(Math.abs(addBox!.x - resetBox!.x)).toBeLessThan(2);
	expect(Math.abs(addBox!.width - resetBox!.width)).toBeLessThan(2);
});

test('publishes the build SHA', async ({ request }) => {
	const body = await request.get('version.json').then((res) => res.json());
	expect(body.sha).toBeTruthy();
	expect(body.builtAt).toBeTruthy();
});
