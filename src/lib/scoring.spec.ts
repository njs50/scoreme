import { describe, expect, it } from 'vitest';
import {
	PLAYER_COLOURS,
	ROUNDS,
	colourClass,
	dealerIndex,
	hasScores,
	parseScore,
	playerTotals
} from './scoring.ts';

describe('ROUNDS', () => {
	it('runs from 2 up to aces', () => {
		expect(ROUNDS).toEqual(['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']);
	});
});

describe('parseScore', () => {
	it.each([
		['15', 15],
		[' 7 ', 7],
		['-3', -3],
		['0', 0],
		['5.9', 5],
		['12 points', 12]
	])('reads %j as %d', (input, expected) => {
		expect(parseScore(input)).toBe(expected);
	});

	it.each(['', '   ', 'abc', '-', '.'])('treats %j as 0', (input) => {
		expect(parseScore(input)).toBe(0);
	});

	it('keeps large scores instead of wrapping to 32-bit integers', () => {
		expect(parseScore('3000000000')).toBe(3_000_000_000);
	});
});

describe('playerTotals', () => {
	it('sums each player across rounds', () => {
		const scores = [
			['5', '7'],
			['10', ''],
			['', '3']
		];
		expect(playerTotals(scores, 2)).toEqual([15, 10]);
	});

	it('returns a zero for every player when nothing is entered', () => {
		expect(playerTotals([[], []], 3)).toEqual([0, 0, 0]);
	});

	it('ignores missing cells for players added mid-game', () => {
		expect(playerTotals([['1'], ['2', '4']], 2)).toEqual([3, 4]);
	});
});

describe('dealerIndex', () => {
	it('moves the deal one seat each round and wraps around', () => {
		expect([0, 1, 2, 3, 4].map((round) => dealerIndex(round, 3))).toEqual([0, 1, 2, 0, 1]);
	});
});

describe('colourClass', () => {
	it('gives each of the first players a distinct colour', () => {
		const classes = Array.from({ length: PLAYER_COLOURS }, (_, i) => colourClass(i));
		expect(new Set(classes).size).toBe(PLAYER_COLOURS);
		expect(classes[0]).toBe('player0');
	});

	it('reuses colours once players outnumber them', () => {
		expect(colourClass(PLAYER_COLOURS)).toBe('player0');
		expect(colourClass(PLAYER_COLOURS + 2)).toBe('player2');
	});
});

describe('hasScores', () => {
	it('is false for an empty sheet', () => {
		expect(
			hasScores([
				['', ''],
				['', ' ']
			])
		).toBe(false);
	});

	it('is true once any score is entered', () => {
		expect(
			hasScores([
				['', ''],
				['', '0']
			])
		).toBe(true);
	});
});
