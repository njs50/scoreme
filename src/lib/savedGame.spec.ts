import { describe, expect, it } from 'vitest';
import { ROUNDS } from './scoring.ts';
import {
	baseFromRoot,
	blankGame,
	parseSavedGame,
	readSavedGame,
	sameGame,
	storageKey,
	writeSavedGame,
	type SavedGame
} from './savedGame.ts';

const game = (
	players: string[],
	cell: (round: number, player: number) => string = () => ''
): SavedGame => ({
	players,
	scores: ROUNDS.map((_, round) => players.map((_, player) => cell(round, player)))
});

describe('blankGame', () => {
	it('starts two players on an empty sheet', () => {
		expect(blankGame()).toEqual(game(['P1', 'P2']));
	});
});

describe('baseFromRoot', () => {
	it('turns the resolved site root into a storage base path', () => {
		expect(baseFromRoot('/scoreme/')).toBe('/scoreme');
		expect(baseFromRoot('/scoreme-preview/')).toBe('/scoreme-preview');
		expect(baseFromRoot('/scoreme')).toBe('/scoreme');
		expect(baseFromRoot('/')).toBe('');
		expect(baseFromRoot('')).toBe('');
	});
});

describe('storageKey', () => {
	it('keeps production and preview games apart, and gives a dev server a key too', () => {
		expect(storageKey('/scoreme')).toBe('scoreme:/scoreme');
		expect(storageKey('/scoreme-preview')).toBe('scoreme:/scoreme-preview');
		expect(storageKey('')).toBe('scoreme:/');
	});
});

describe('parseSavedGame', () => {
	const valid = game(['Ada', 'Bea'], (round, player) => (round === 0 && player === 0 ? '4' : ''));

	it('returns a copy of a sheet this app could have written', () => {
		const parsed = parseSavedGame(JSON.stringify(valid));
		expect(parsed).toEqual(valid);
		parsed!.players.push('Cy');
		parsed!.scores[0][0] = '9';
		expect(parseSavedGame(JSON.stringify(valid))).toEqual(valid);
	});

	it('rejects anything that is not a sheet', () => {
		expect(parseSavedGame(null)).toBeNull();
		expect(parseSavedGame('{')).toBeNull();
		expect(parseSavedGame('null')).toBeNull();
		expect(parseSavedGame('1')).toBeNull();
		expect(parseSavedGame('[]')).toBeNull();
		expect(parseSavedGame('{}')).toBeNull();
		expect(parseSavedGame(JSON.stringify({ players: 'Ada', scores: [] }))).toBeNull();
		expect(parseSavedGame(JSON.stringify({ players: [], scores: [] }))).toBeNull();
		expect(parseSavedGame(JSON.stringify({ players: [1], scores: [] }))).toBeNull();
		expect(parseSavedGame(JSON.stringify({ players: ['Ada'], scores: [] }))).toBeNull();
		expect(
			parseSavedGame(JSON.stringify({ players: ['Ada'], scores: valid.scores.map(() => 'x') }))
		).toBeNull();
		expect(
			parseSavedGame(JSON.stringify({ players: ['Ada'], scores: valid.scores.map(() => ['', '']) }))
		).toBeNull();
		expect(
			parseSavedGame(JSON.stringify({ players: ['Ada'], scores: valid.scores.map(() => [1]) }))
		).toBeNull();
	});
});

describe('readSavedGame', () => {
	it('reads a sheet back', () => {
		const stored = game(['Ada']);
		const storage = {
			getItem: (key: string) => (key === 'scoreme:/scoreme' ? JSON.stringify(stored) : null)
		};
		expect(readSavedGame(storage, 'scoreme:/scoreme')).toEqual(stored);
		expect(readSavedGame(storage, 'missing')).toBeNull();
	});

	it('treats a storage failure as no saved game', () => {
		const storage = {
			getItem: () => {
				throw new DOMException('denied');
			}
		};
		expect(readSavedGame(storage, 'scoreme:/scoreme')).toBeNull();
	});
});

describe('writeSavedGame', () => {
	it('stores the sheet as JSON', () => {
		let written: [string, string] | undefined;
		const storage = {
			setItem: (key: string, value: string) => {
				written = [key, value];
			}
		};
		const stored = game(['Ada']);
		expect(writeSavedGame(storage, 'scoreme:/scoreme', stored)).toBe(true);
		expect(written).toEqual(['scoreme:/scoreme', JSON.stringify(stored)]);
	});

	it('reports a refused write', () => {
		const storage = {
			setItem: () => {
				throw new DOMException('quota', 'QuotaExceededError');
			}
		};
		expect(writeSavedGame(storage, 'scoreme:/scoreme', game(['Ada']))).toBe(false);
	});
});

describe('sameGame', () => {
	it('compares the stored shape', () => {
		const stored = game(['Ada']);
		expect(sameGame(stored, game(['Ada']))).toBe(true);
		expect(sameGame(stored, game(['Bea']))).toBe(false);
	});
});
