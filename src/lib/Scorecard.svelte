<script lang="ts">
	import { selectTextOnFocus, blurOnEscape } from './inputDirectives.ts';
	import { ROUNDS, colourClass, dealerIndex, hasScores, playerTotals } from './scoring.ts';

	type Player = {
		name: string;
	};

	let players: Player[] = $state([{ name: 'P1' }, { name: 'P2' }]);

	let scores: string[][] = $state(ROUNDS.map(() => players.map(() => '')));

	let totals = $derived(playerTotals(scores, players.length));

	const playerLabel = (idx: number) => players[idx].name.trim() || `Player ${idx + 1}`;

	const confirmLeave = (e: BeforeUnloadEvent) => {
		if (!hasScores(scores)) return;
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
</script>

<svelte:window onbeforeunload={confirmLeave} />

<section>
	<table>
		<thead>
			<tr>
				<td class="round">
					<button type="button" class="add-player" aria-label="Add player" onclick={addPlayer}
						>+</button
					>
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

	.add-player {
		border: none;
		background: none;
		font: inherit;
		color: inherit;
		padding: 0;
		width: 100%;
		cursor: pointer;
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
