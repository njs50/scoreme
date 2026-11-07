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

		await score('P1', '2').fill('5');
		await score('P1', '3').fill('10');
		await score('P2', '2').fill('7');
		await score('P2', 'A').fill('not a number');

		await expect.element(total('P1')).toHaveTextContent('15');
		await expect.element(total('P2')).toHaveTextContent('7');
	});

	it('adds a player with an empty column', async () => {
		await render(Scorecard);

		await page.getByRole('button', { name: 'Add player' }).click();

		await expect.element(page.getByLabelText('Player 3 name')).toHaveValue('P3');
		await score('P3', '4').fill('3');
		await expect.element(total('P3')).toHaveTextContent('3');
	});

	it('labels cells with the edited player name', async () => {
		await render(Scorecard);

		await page.getByLabelText('Player 1 name').fill('Greer');
		await score('Greer', '2').fill('4');
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
		await score('Ada', '2').fill('4');
		await expect.poll(() => localStorage.getItem(KEY)).toContain('Ada');
		await first.unmount();

		await render(Scorecard);
		await expect.element(page.getByLabelText('Player 1 name')).toHaveValue('Ada');
		await expect.element(page.getByLabelText('Player 3 name')).toHaveValue('P3');
		await expect.element(score('Ada', '2')).toHaveValue('4');
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

		await score('P1', '2').fill('5');
		expect(unloadPrevented()).toBe(false);
		expect(localStorage.getItem(KEY)).toContain('5');
	});

	it('asks before leaving when the browser rejects the save', async () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('quota', 'QuotaExceededError');
		});
		await render(Scorecard);
		await score('P1', '2').fill('5');
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
		await score('P1', '2').fill('5');

		await page.getByRole('button', { name: 'New game' }).click();
		await expect.element(score('P1', '2')).toHaveValue('5');
		expect(confirm).toHaveBeenCalledWith(
			'Start a new game? This clears the scores saved on this device.'
		);

		confirm.mockReturnValue(true);
		await page.getByRole('button', { name: 'New game' }).click();
		await expect.element(page.getByLabelText('Player 1 name')).toHaveValue('P1');
		await expect.element(score('P1', '2')).toHaveValue('');
		await expect.poll(() => localStorage.getItem(KEY)).not.toContain('5');
	});
});
