<script lang="ts">
	import { selectTextOnFocus, blurOnEscape } from '#lib/inputDirectives.ts';

	type ScoreRow = string[];

	type Player = {
		name: string;
	};

	let currentPlayers: Player[] = $state([{ name: 'P1' }, { name: 'P2' }]);

	const emptyRow = (): ScoreRow => currentPlayers.map(() => '');

	// One row per round, from 2's wild up to Aces.
	let scores: ScoreRow[] = $state(Array.from({ length: 13 }, emptyRow));

	let totals = $derived(
		currentPlayers.map((_, playerIdx) =>
			scores.reduce((total, sr) => total + (parseInt(sr[playerIdx]) | 0), 0)
		)
	);

	const rowLabel = (idx: number) => {
		switch (idx) {
			case 11:
				return 'J';
			case 12:
				return 'Q';
			case 13:
				return 'K';
			case 14:
				return 'A';
			default:
				return idx.toString();
		}
	};

	const confirmLeave = (e: BeforeUnloadEvent) => {
		e.preventDefault();
		// Older browsers only show the prompt when returnValue is set.
		e.returnValue = true;
	};

	const addPlayer = () => {
		currentPlayers.push({ name: 'P' + (currentPlayers.length + 1).toString() });
		for (const sr of scores) {
			sr.push('');
		}
	};
</script>

<svelte:head>
	<title>Score</title>
	<meta name="description" content="Score game" />
</svelte:head>

<svelte:window onbeforeunload={confirmLeave} />

<section>
	<table>
		<thead>
			<tr>
				<td class="round" onclick={addPlayer}>+</td>
				{#each currentPlayers as player, idx (idx)}
					<td class="pcol player{idx}">
						<input type="text" bind:value={player.name} use:selectTextOnFocus use:blurOnEscape />
					</td>
				{/each}
			</tr>
		</thead>

		<tbody>
			{#each scores as sr, rowIdx (rowIdx)}
				<tr>
					<td class="round player{rowIdx % currentPlayers.length}">{rowLabel(rowIdx + 2)}</td>
					{#each sr, idx (idx)}
						<td class="pcol player{idx}">
							<input type="tel" bind:value={sr[idx]} use:selectTextOnFocus use:blurOnEscape />
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>

		<tfoot>
			<tr>
				<td class="round">Total:</td>
				{#each totals as total, idx (idx)}
					<td class="pcol player{idx}">{total}</td>
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
		border: 1px solid black;
		text-align: center;
		padding: 0.25em;
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
