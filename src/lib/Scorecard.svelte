<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { selectTextOnFocus, blurOnEscape } from './inputDirectives.ts';
	import {
		baseFromRoot,
		blankGame,
		readSavedGame,
		sameGame,
		storageKey,
		writeSavedGame,
		type SavedGame
	} from './savedGame.ts';
	import { ROUNDS, colourClass, dealerIndex, hasScores, playerTotals } from './scoring.ts';

	type Player = {
		name: string;
	};

	const initial = blankGame();
	let players: Player[] = $state(initial.players.map((name) => ({ name })));
	let scores: string[][] = $state(initial.scores);
	// Hidden until the stored sheet is applied, so a saved game doesn't flash up blank.
	let ready = $state(false);

	const key = storageKey(baseFromRoot(resolve('/')));

	const snapshot = (): SavedGame => ({
		players: players.map((player) => player.name),
		scores: scores.map((row) => [...row])
	});

	const apply = (game: SavedGame) => {
		players = game.players.map((name) => ({ name }));
		scores = game.scores.map((row) => [...row]);
	};

	onMount(() => {
		const saved = readSavedGame(localStorage, key);
		if (saved) apply(saved);
		ready = true;
	});

	// Writes on every edit, so a phone discarding the app mid-game keeps the sheet.
	$effect(() => {
		const game = snapshot();
		if (ready) writeSavedGame(localStorage, key, game);
	});

	let totals = $derived(playerTotals(scores, players.length));

	const playerLabel = (idx: number) => players[idx].name.trim() || `Player ${idx + 1}`;

	const confirmLeave = (e: BeforeUnloadEvent) => {
		const game = snapshot();
		if (!hasScores(game.scores)) return;
		// The prompt is only honest when the sheet is not actually in localStorage.
		const stored = writeSavedGame(localStorage, key, game)
			? readSavedGame(localStorage, key)
			: null;
		if (stored && sameGame(stored, game)) return;
		e.preventDefault();
		// Older browsers only show the prompt when returnValue is set.
		e.returnValue = true;
	};

	const addPlayer = () => {
		players.push({ name: 'P' + (players.length + 1).toString() });
		for (const row of scores) {
			row.push('');
		}
	};

	const newGame = () => {
		if (
			!sameGame(snapshot(), blankGame()) &&
			!confirm('Start a new game? This clears the scores saved on this device.')
		) {
			return;
		}
		apply(blankGame());
	};
</script>

<svelte:window onbeforeunload={confirmLeave} />

<section class:ready>
	<table>
		<thead>
			<tr>
				<td class="round">
					<span class="sheet-actions">
						<button type="button" aria-label="Add player" onclick={addPlayer}>+</button>
						<button type="button" aria-label="New game" onclick={newGame}>
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path
									fill="currentColor"
									d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7a5 5 0 1 1-4.9 6H5.02A7 7 0 1 0 17.65 6.35z"
								/>
							</svg>
						</button>
					</span>
				</td>
				{#each players as player, idx (idx)}
					<td class="pcol {colourClass(idx)}">
						<input
							type="text"
							aria-label="Player {idx + 1} name"
							bind:value={player.name}
							use:selectTextOnFocus
							use:blurOnEscape
						/>
					</td>
				{/each}
			</tr>
		</thead>

		<tbody>
			{#each scores as row, roundIdx (roundIdx)}
				<tr>
					<td class="round {colourClass(dealerIndex(roundIdx, players.length))}"
						>{ROUNDS[roundIdx]}</td
					>
					{#each row, idx (idx)}
						<td class="pcol {colourClass(idx)}">
							<input
								type="tel"
								aria-label="{playerLabel(idx)} score, round {ROUNDS[roundIdx]}"
								bind:value={row[idx]}
								use:selectTextOnFocus
								use:blurOnEscape
							/>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>

		<tfoot>
			<tr>
				<td class="round">Total:</td>
				{#each totals as total, idx (idx)}
					<td class="pcol {colourClass(idx)}" aria-label="{playerLabel(idx)} total">{total}</td>
				{/each}
			</tr>
		</tfoot>
	</table>
</section>

<style>
	section {
		position: absolute;
		height: 100%;
	}

	table {
		max-width: 100%;
	}

	td {
		border: 1px solid black;
		text-align: center;
		padding: 0.25em;
	}

	td.pcol {
		min-width: 2.5rem;
	}

	td.round {
		width: 2.5rem;
	}

	td input {
		border: none;
		background: none;
		display: inline-block;
		text-align: center;
		padding: 0;
		width: 100%;
		max-width: 6em;
	}

	.sheet-actions {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.15rem;
	}

	.sheet-actions button {
		border: none;
		background: none;
		font: inherit;
		color: inherit;
		padding: 0.1em;
		line-height: 1;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.sheet-actions svg {
		width: 1em;
		height: 1em;
		display: block;
	}

	section:not(.ready) {
		visibility: hidden;
	}

	table thead,
	table tfoot {
		position: -webkit-sticky; /* Safari */
		position: sticky;
		background: white;
	}

	table thead {
		inset-block-start: 0; /* "top" */
	}
	table tfoot {
		inset-block-end: 0; /* "bottom" */
	}
</style>
