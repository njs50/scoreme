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
	<table style:--players={players.length} style:--rows={ROUNDS.length + 2}>
		<thead>
			<tr>
				<td class="round">
					<button type="button" aria-label="Add player" onclick={addPlayer}>+</button>
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
				<td class="round">
					<button type="button" aria-label="New game" onclick={newGame}>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path
								fill="currentColor"
								d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7a5 5 0 1 1-4.9 6H5.02A7 7 0 1 0 17.65 6.35z"
							/>
						</svg>
					</button>
				</td>
				{#each totals as total, idx (idx)}
					<td class="pcol {colourClass(idx)}" aria-label="{playerLabel(idx)} total">{total}</td>
				{/each}
			</tr>
		</tfoot>
	</table>
</section>

<style>
	section {
		flex: 1;
		min-height: 0;
		min-width: 0;
		overflow: auto;
		display: flex;
		flex-direction: column;
	}

	section:not(.ready) {
		visibility: hidden;
	}

	table {
		--round: 2.4em;
		/* Percentage heights on table rows dump the leftover pixels onto the last
		   scoring row, so the sheet is a flex column of equal rows instead. */
		display: flex;
		flex-direction: column;
		width: 100%;
		/* A column stays wide enough for three digits, then the sheet scrolls sideways. */
		min-width: calc(var(--round) + var(--players) * 4.5ch);
		flex: 1 1 auto;
		min-height: min-content;
		border-top: 1px solid black;
		border-left: 1px solid black;
		box-sizing: border-box;
		font-size: clamp(1rem, 3.2dvh, 2.25rem);
	}

	thead,
	tbody,
	tfoot {
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	thead,
	tfoot {
		flex: 1 1 auto;
	}

	tbody {
		flex: calc(var(--rows) - 2) 1 auto;
	}

	tr {
		display: flex;
		flex: 1 1 auto;
		min-height: 0;
		min-width: 0;
	}

	td {
		display: flex;
		border: 0;
		border-right: 1px solid black;
		border-bottom: 1px solid black;
		text-align: center;
		padding: 0;
		min-width: 0;
		min-height: 0;
		box-sizing: border-box;
	}

	td.round {
		flex: 0 0 var(--round);
		width: var(--round);
	}

	td.pcol {
		flex: 1 1 4.5ch;
		min-width: 4.5ch;
	}

	td input,
	td button {
		border: none;
		background: none;
		color: inherit;
		font: inherit;
		text-align: center;
		padding: 0;
		margin: 0;
		flex: 1 1 auto;
		width: 100%;
		min-width: 0;
		min-height: 0;
		box-sizing: border-box;
	}

	td input:focus {
		/* The ring stays inside the cell, so a focused row is not taller than the others. */
		outline-offset: -2px;
	}

	td button {
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		line-height: 1;
	}

	td button svg {
		width: 0.9em;
		height: 0.9em;
		display: block;
	}

	table thead,
	table tfoot {
		position: -webkit-sticky; /* Safari */
		position: sticky;
		background: white;
	}

	table thead {
		inset-block-start: 0;
	}

	table tfoot {
		inset-block-end: 0;
	}
</style>
