import { ROUNDS } from './scoring.ts';

/** Names plus every score cell, small enough to keep in localStorage. */
export type SavedGame = {
	players: string[];
	scores: string[][];
};

/** A fresh sheet: two players, nothing scored. */
export function blankGame(): SavedGame {
	return {
		players: ['P1', 'P2'],
		scores: ROUNDS.map(() => ['', ''])
	};
}

/**
 * localStorage is per origin, and production and preview share njs50.github.io,
 * so the key carries the base path the same way cache names do.
 */
export function storageKey(base: string): string {
	return `scoreme:${base || '/'}`;
}

/** `resolve('/')` is `/scoreme/` in production and `/` in dev. Drop the trailing slash. */
export function baseFromRoot(root: string): string {
	if (root === '/' || root === '') return '';
	return root.endsWith('/') ? root.slice(0, -1) : root;
}

/** The stored sheet, or null when nothing usable is saved. */
export function parseSavedGame(raw: string | null): SavedGame | null {
	if (raw === null) return null;
	let value: unknown;
	try {
		value = JSON.parse(raw);
	} catch {
		return null;
	}
	if (!isSavedGame(value)) return null;
	return {
		players: [...value.players],
		scores: value.scores.map((row) => [...row])
	};
}

function isSavedGame(value: unknown): value is SavedGame {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
	const record = value as { players?: unknown; scores?: unknown };
	return isNameList(record.players) && isScoreGrid(record.scores, record.players.length);
}

function isNameList(value: unknown): value is string[] {
	return (
		Array.isArray(value) && value.length > 0 && value.every((name) => typeof name === 'string')
	);
}

function isScoreGrid(value: unknown, playerCount: number): value is string[][] {
	return (
		Array.isArray(value) &&
		value.length === ROUNDS.length &&
		value.every(
			(row) =>
				Array.isArray(row) &&
				row.length === playerCount &&
				row.every((cell) => typeof cell === 'string')
		)
	);
}

export function readSavedGame(storage: Pick<Storage, 'getItem'>, key: string): SavedGame | null {
	try {
		return parseSavedGame(storage.getItem(key));
	} catch {
		return null;
	}
}

/** False when the browser refuses the write (private mode, full storage). */
export function writeSavedGame(
	storage: Pick<Storage, 'setItem'>,
	key: string,
	game: SavedGame
): boolean {
	try {
		storage.setItem(key, JSON.stringify(game));
		return true;
	} catch {
		return false;
	}
}

export function sameGame(a: SavedGame, b: SavedGame): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}
