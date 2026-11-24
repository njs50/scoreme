import { expect, test } from '@playwright/test';

const score = (page: import('@playwright/test').Page, player: string, round: string) =>
	page.getByLabel(`${player} score, round ${round}`, { exact: true });
const total = (page: import('@playwright/test').Page, player: string) =>
	page.getByLabel(`${player} total`, { exact: true });

async function enter(
	page: import('@playwright/test').Page,
	player: string,
	round: string,
	keys: string
) {
	await page.keyboard.press('Escape');
	await score(page, player, round).click();
	await page.keyboard.type(keys);
}

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

	await enter(page, 'Greer', '2', '5');
	await enter(page, 'Greer', '3', '10');
	await enter(page, 'P2', '2', '7');
	await enter(page, 'P3', 'A', '3');

	await expect(total(page, 'Greer')).toHaveText('15');
	await expect(total(page, 'P2')).toHaveText('7');
	await expect(total(page, 'P3')).toHaveText('3');
});

test('typing into a filled cell replaces its score', async ({ page }) => {
	await page.goto('');
	const cell = score(page, 'P1', '2');
	await enter(page, 'P1', '2', '12');

	await cell.click();
	await page.keyboard.type('4');

	await expect(cell).toHaveText('4');
	await expect(total(page, 'P1')).toHaveText('4');
});

test('Escape closes the keypad', async ({ page }) => {
	await page.goto('');
	await score(page, 'P1', '2').click();
	const keypad = page.getByRole('dialog', { name: 'Score keypad' });
	await expect(keypad).toBeVisible();

	await page.keyboard.press('Escape');

	await expect(keypad).toHaveCount(0);
});

test('keeps the game across a reload without asking', async ({ page }) => {
	await page.goto('');
	await page.getByRole('button', { name: 'Add player' }).click();
	await page.getByLabel('Player 1 name').fill('Greer');
	await enter(page, 'Greer', '2', '5');
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
	await expect(score(page, 'Greer', '2')).toHaveText('5');
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
	await enter(page, 'P1', '2', '5');

	const dialog = page.waitForEvent('dialog');
	const reload = page.reload();
	const prompt = await dialog;
	expect(prompt.type()).toBe('beforeunload');
	await prompt.accept();
	await reload;

	await expect(score(page, 'P1', '2')).toHaveText('');
});

test('clears the saved game after confirmation', async ({ page }) => {
	await page.goto('');
	await page.getByLabel('Player 1 name').fill('Greer');
	await page.getByRole('button', { name: 'Add player' }).click();
	await enter(page, 'Greer', '2', '5');
	await page.keyboard.press('Escape');

	page.once('dialog', (dialog) => {
		expect(dialog.type()).toBe('confirm');
		void dialog.dismiss();
	});
	await page.getByRole('button', { name: 'New game' }).click();
	await expect(score(page, 'Greer', '2')).toHaveText('5');

	page.once('dialog', (dialog) => {
		void dialog.accept();
	});
	await page.getByRole('button', { name: 'New game' }).click();
	await expect(page.getByLabel('Player 1 name')).toHaveValue('P1');
	await expect(page.getByLabel('Player 3 name')).toHaveCount(0);
	await expect(score(page, 'P1', '2')).toHaveText('');

	const dialogs: string[] = [];
	page.on('dialog', (dialog) => {
		dialogs.push(dialog.type());
		void dialog.accept();
	});
	await page.reload();
	await expect(page.getByLabel('Player 1 name')).toHaveValue('P1');
	await expect(score(page, 'P1', '2')).toHaveText('');
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
		.locator('tr')
		.evaluateAll((rows) => rows.map((row) => row.getBoundingClientRect().height));
	expect(rowHeights).toHaveLength(15);
	expect(Math.max(...rowHeights) - Math.min(...rowHeights)).toBeLessThan(1);
	expect(await sheet.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);

	const add = page.getByRole('button', { name: 'Add player' });
	for (let i = 0; i < 8; i++) await add.click();
	const cell = score(page, 'P1', '2');
	await cell.click();
	await page.keyboard.type('999');

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

test('the keypad covers the sheet without moving it', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('');
	const table = page.locator('table');
	const before = await table.boundingBox();

	await score(page, 'P1', '2').click();
	await page.keyboard.type('10+5');

	const during = await table.boundingBox();
	expect(Math.abs(during!.y - before!.y)).toBeLessThan(1);
	expect(Math.abs(during!.height - before!.height)).toBeLessThan(1);
	await expect(page.locator('input[type="tel"]')).toHaveCount(0);
	await expect(score(page, 'P1', '2')).toHaveText('15');
	await expect(page.getByRole('dialog', { name: 'Score keypad' })).toContainText('10 + 5');

	await page.getByRole('button', { name: 'Next row' }).click();
	await expect(page.getByRole('button', { name: 'P1, round 3' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await page.getByRole('button', { name: 'Close keypad' }).click();
	await expect(page.getByRole('dialog', { name: 'Score keypad' })).toHaveCount(0);

	const after = await table.boundingBox();
	expect(Math.abs(after!.y - before!.y)).toBeLessThan(1);
	expect(Math.abs(after!.height - before!.height)).toBeLessThan(1);
	await expect(total(page, 'P1')).toHaveText('15');
});

test('slides a covered row above the keypad and back when it closes', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('');
	const table = page.locator('table');
	const before = (await table.boundingBox())!;

	await score(page, 'P1', 'K').click();
	await page.keyboard.type('4*5');

	const cell = score(page, 'P1', 'K');
	const keypad = page.getByRole('dialog', { name: 'Score keypad' });
	const viewport = page.viewportSize()!;
	// The keypad rises in over the sheet. Wait until it has settled, then the row should have slid with it.
	await expect
		.poll(async () => {
			const pad = (await keypad.boundingBox())!;
			return Math.abs(pad.y + pad.height - viewport.height);
		})
		.toBeLessThan(2);
	const rested = (await keypad.boundingBox())!;
	const row = (await cell.boundingBox())!;
	expect(row.y + row.height).toBeLessThanOrEqual(rested.y + 1);
	expect((await table.boundingBox())!.y).toBeLessThan(before.y - 20);
	await expect(cell).toHaveText('20');
	await expect(keypad).toContainText('4 × 5');

	await page.keyboard.press('Escape');
	await expect(keypad).toHaveCount(0);
	await expect
		.poll(async () => Math.abs((await table.boundingBox())!.y - before.y))
		.toBeLessThan(1);
});

test('publishes the build SHA', async ({ request }) => {
	const body = await request.get('version.json').then((res) => res.json());
	expect(body.sha).toBeTruthy();
	expect(body.builtAt).toBeTruthy();
});
