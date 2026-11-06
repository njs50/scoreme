import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Scorecard from './Scorecard.svelte';
import { ROUNDS } from './scoring.ts';

const score = (player: string, round: string) =>
	page.getByLabelText(`${player} score, round ${round}`, { exact: true });
const total = (player: string) => page.getByLabelText(`${player} total`, { exact: true });

function unloadPrevented() {
	const event = new Event('beforeunload', { cancelable: true });
	window.dispatchEvent(event);
	return event.defaultPrevented;
}

describe('Scorecard', () => {
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

	it('only asks before leaving once scores have been entered', async () => {
		await render(Scorecard);
		expect(unloadPrevented()).toBe(false);

		await score('P1', '2').fill('5');
		expect(unloadPrevented()).toBe(true);
	});
});
