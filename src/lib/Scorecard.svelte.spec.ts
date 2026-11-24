import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Scorecard from './Scorecard.svelte';
import { ROUNDS } from './scoring.ts';
import { storageKey } from './savedGame.ts';

const KEY = storageKey('');

const score = (player: string, round: string) =>
	page.getByLabelText(`${player} score, round ${round}`, { exact: true });
const total = (player: string) => page.getByLabelText(`${player} total`, { exact: true });

const keyLabel: Record<string, string> = {
	'+': 'Add',
	'-': 'Subtract',
	'*': 'Multiply',
	'=': 'Equals',
	C: 'Clear',
	'<': 'Delete'
};

/** Close the keypad, then tap a cell and type. "=" collapses the expression. */
async function enterScore(player: string, round: string, keys: string) {
	keydown('Escape');
	await expect.poll(() => document.querySelector('[role="dialog"]')).toBeNull();
	await score(player, round).click();
	for (const char of keys) {
		await page.getByRole('button', { name: keyLabel[char] ?? char, exact: true }).click();
	}
}

function keydown(key: string) {
	window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function unloadPrevented() {
	const event = new Event('beforeunload', { cancelable: true });
	window.dispatchEvent(event);
	return event.defaultPrevented;
}

describe('Scorecard', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('starts with two players and a row per round', async () => {
		const { container } = await render(Scorecard);

		await expect.element(page.getByLabelText('Player 1 name')).toHaveValue('P1');
		await expect.element(page.getByLabelText('Player 2 name')).toHaveValue('P2');
		const labels = [...container.querySelectorAll('tbody td.round')].map((td) => td.textContent);
		expect(labels).toEqual([...ROUNDS]);
		await expect.element(total('P1')).toHaveTextContent('0');
		await expect.element(total('P2')).toHaveTextContent('0');
	});

	it('totals each player as scores are entered', async () => {
		await render(Scorecard);

		await enterScore('P1', '2', '10+5=');
		await enterScore('P1', '3', '10');
		await enterScore('P2', '2', '7');
		await enterScore('P2', 'A', '20-3');

		await expect.element(total('P1')).toHaveTextContent('25');
		await expect.element(total('P2')).toHaveTextContent('24');
		await expect.element(score('P1', '2')).toHaveTextContent('15');
		await expect.element(score('P2', 'A')).toHaveTextContent('17');
	});

	it('adds a player with an empty column', async () => {
		await render(Scorecard);

		await page.getByRole('button', { name: 'Add player' }).click();

		await expect.element(page.getByLabelText('Player 3 name')).toHaveValue('P3');
		await enterScore('P3', '4', '3');
		await expect.element(total('P3')).toHaveTextContent('3');
	});

	it('labels cells with the edited player name', async () => {
		await render(Scorecard);

		await page.getByLabelText('Player 1 name').fill('Greer');
		await enterScore('Greer', '2', '4');
		await expect.element(total('Greer')).toHaveTextContent('4');

		await page.getByLabelText('Player 1 name').fill('  ');
		await expect.element(total('Player 1')).toHaveTextContent('4');
	});

	it('highlights the dealer for each round, rotating through the players', async () => {
		const { container } = await render(Scorecard);
		await page.getByRole('button', { name: 'Add player' }).click();

		const rounds = [...container.querySelectorAll('tbody td.round')];
		expect(rounds.slice(0, 4).map((td) => td.className)).toEqual([
			expect.stringContaining('player0'),
			expect.stringContaining('player1'),
			expect.stringContaining('player2'),
			expect.stringContaining('player0')
		]);
	});

	it('keeps colouring players beyond the ninth', async () => {
		await render(Scorecard);
		const add = page.getByRole('button', { name: 'Add player' });
		for (let i = 0; i < 8; i++) await add.click();

		await expect.element(total('P10')).toHaveClass('player0');
	});

	it('restores the saved sheet on the next visit', async () => {
		const first = await render(Scorecard);
		await page.getByLabelText('Player 1 name').fill('Ada');
		await page.getByRole('button', { name: 'Add player' }).click();
		await enterScore('Ada', '2', '4');
		await expect.poll(() => localStorage.getItem(KEY)).toContain('Ada');
		await first.unmount();

		await render(Scorecard);
		await expect.element(page.getByLabelText('Player 1 name')).toHaveValue('Ada');
		await expect.element(page.getByLabelText('Player 3 name')).toHaveValue('P3');
		await expect.element(score('Ada', '2')).toHaveTextContent('4');
		await expect.element(total('Ada')).toHaveTextContent('4');
	});

	it('starts fresh when the stored sheet cannot be read', async () => {
		localStorage.setItem(KEY, '{');
		await render(Scorecard);
		await expect.element(page.getByLabelText('Player 1 name')).toHaveValue('P1');
	});

	it('does not ask before leaving once the sheet is stored', async () => {
		await render(Scorecard);
		expect(unloadPrevented()).toBe(false);

		await enterScore('P1', '2', '5');
		expect(unloadPrevented()).toBe(false);
		expect(localStorage.getItem(KEY)).toContain('5');
	});

	it('asks before leaving when the browser rejects the save', async () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('quota', 'QuotaExceededError');
		});
		await render(Scorecard);
		await enterScore('P1', '2', '5');
		expect(unloadPrevented()).toBe(true);
	});

	it('does not ask before resetting a blank sheet', async () => {
		const confirm = vi.spyOn(window, 'confirm');
		await render(Scorecard);

		await page.getByRole('button', { name: 'New game' }).click();

		expect(confirm).not.toHaveBeenCalled();
		await expect.element(page.getByLabelText('Player 1 name')).toHaveValue('P1');
	});

	it('asks before clearing a renamed sheet that has no scores', async () => {
		const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
		const { container } = await render(Scorecard);
		await page.getByLabelText('Player 1 name').fill('Ada');
		await page.getByRole('button', { name: 'Add player' }).click();

		await page.getByRole('button', { name: 'New game' }).click();

		expect(confirm).toHaveBeenCalled();
		await expect.element(page.getByLabelText('Player 1 name')).toHaveValue('Ada');
		expect(container.querySelectorAll('thead input')).toHaveLength(3);
	});

	it('clears a scored game only after confirmation', async () => {
		const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
		await render(Scorecard);
		await enterScore('P1', '2', '5');
		keydown('Escape');

		await page.getByRole('button', { name: 'New game' }).click();
		await expect.element(score('P1', '2')).toHaveTextContent('5');
		expect(confirm).toHaveBeenCalledWith(
			'Start a new game? This clears the scores saved on this device.'
		);

		confirm.mockReturnValue(true);
		await page.getByRole('button', { name: 'New game' }).click();
		await expect.element(page.getByLabelText('Player 1 name')).toHaveValue('P1');
		await expect
			.poll(() => document.querySelector('[aria-label="P1 score, round 2"]')?.textContent)
			.toBe('');
		await expect.poll(() => localStorage.getItem(KEY)).not.toContain('5');
	});

	it('enters a score from the keypad without a text field', async () => {
		const { container } = await render(Scorecard);

		expect(container.querySelector('input[type="tel"]')).toBeNull();
		await enterScore('P1', '2', '10+4');
		await expect.element(page.getByRole('dialog', { name: 'Score keypad' })).toBeVisible();
		await expect.element(score('P1', '2')).toHaveTextContent('14');
		await expect
			.element(page.getByRole('button', { name: 'P1, round 2' }))
			.toHaveAttribute('aria-pressed', 'true');
		await page.getByRole('button', { name: 'P1, round 2' }).click();
		await expect.element(score('P1', '2')).toHaveTextContent('14');

		await page.getByRole('button', { name: 'P2, round 2' }).click();
		await enterScore('P2', '2', '-3');
		await expect.element(score('P1', '2')).toHaveTextContent('14');
		await expect.element(score('P2', '2')).toHaveTextContent('-3');

		await page.getByRole('button', { name: 'Next row' }).click();
		await expect
			.element(page.getByRole('button', { name: 'P2, round 3' }))
			.toHaveAttribute('aria-pressed', 'true');
		await page.getByRole('button', { name: 'Close keypad' }).click();
		expect(document.querySelector('[role="dialog"]')).toBeNull();
	});

	it('replaces a score from the keyboard, then moves and closes', async () => {
		await render(Scorecard);
		await enterScore('P1', '2', '12');
		await score('P1', '2').click();
		keydown('4');
		await expect.element(score('P1', '2')).toHaveTextContent('4');

		keydown('ArrowRight');
		await expect
			.element(page.getByRole('button', { name: 'P2, round 2' }))
			.toHaveAttribute('aria-pressed', 'true');
		keydown('ArrowLeft');
		await expect
			.element(page.getByRole('button', { name: 'P1, round 2' }))
			.toHaveAttribute('aria-pressed', 'true');
		keydown('ArrowLeft');
		await expect
			.element(page.getByRole('button', { name: 'P1, round 2' }))
			.toHaveAttribute('aria-pressed', 'true');
		keydown('a');

		for (const round of ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']) {
			keydown('ArrowDown');
			await expect
				.element(page.getByRole('button', { name: `P1, round ${round}` }))
				.toHaveAttribute('aria-pressed', 'true');
		}
		keydown('ArrowDown');
		await expect.poll(() => document.querySelector('[role="dialog"]')).toBeNull();
	});

	it('drops an unfinished minus and closes when a name is edited', async () => {
		await render(Scorecard);
		await score('P1', '2').click();
		await page.getByRole('button', { name: 'Subtract', exact: true }).click();
		await page.getByLabelText('Player 1 name').click();

		await expect.poll(() => document.querySelector('[role="dialog"]')).toBeNull();
		await expect
			.poll(() => document.querySelector('[aria-label="P1 score, round 2"]')?.textContent)
			.toBe('');
	});

	it('clears the expression and keeps the last player in view', async () => {
		await render(Scorecard);
		const add = page.getByRole('button', { name: 'Add player' });
		for (let i = 0; i < 8; i++) await add.click();

		await enterScore('P10', '2', '8<');
		await expect
			.poll(() => document.querySelector('[aria-label="P10 score, round 2"]')?.textContent)
			.toBe('');
		await expect
			.element(page.getByRole('button', { name: 'P10, round 2' }))
			.toHaveAttribute('aria-pressed', 'true');

		keydown('ArrowRight');
		await expect
			.element(page.getByRole('button', { name: 'P10, round 2' }))
			.toHaveAttribute('aria-pressed', 'true');
	});
});
