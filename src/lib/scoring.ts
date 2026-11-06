/** One round per wild card, from 2's wild up to Aces. */
export const ROUNDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

/** How many `.playerN` colour classes app.css defines. */
export const PLAYER_COLOURS = 9;

/** Whole-number score from a cell. Blank or non-numeric input counts as 0. */
export function parseScore(value: string): number {
	const score = Number.parseInt(value, 10);
	return Number.isNaN(score) ? 0 : score;
}

/** Sum of each player's scores across every round. */
export function playerTotals(
	scores: readonly (readonly string[])[],
	playerCount: number
): number[] {
	return Array.from({ length: playerCount }, (_, player) =>
		scores.reduce((total, row) => total + parseScore(row[player] ?? ''), 0)
	);
}

/** The deal moves one seat to the left each round. */
export function dealerIndex(round: number, playerCount: number): number {
	return round % playerCount;
}

/** Colours repeat once there are more players than colours. */
export function colourClass(player: number): string {
	return `player${player % PLAYER_COLOURS}`;
}

/** True once any score has been entered, i.e. reloading would lose something. */
export function hasScores(scores: readonly (readonly string[])[]): boolean {
	return scores.some((row) => row.some((score) => score.trim() !== ''));
}
