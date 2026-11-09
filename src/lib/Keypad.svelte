<script lang="ts">
	import { chipScrollLeft, type Key } from './keypad.ts';

	type Chip = {
		label: string;
		score: string;
		colour: string;
	};

	let {
		round,
		colour,
		chips,
		active,
		expression,
		preview,
		onSelect,
		onKey,
		onNext,
		onClose
	}: {
		round: string;
		colour: string;
		chips: Chip[];
		active: number;
		expression: string;
		preview: string | null;
		onSelect: (player: number) => void;
		onKey: (key: Key) => void;
		onNext: () => void;
		onClose: () => void;
	} = $props();

	let scroller: HTMLDivElement | null = $state(null);

	const keys: { key: Key; label: string; name: string }[] = [
		{ key: '1', label: '1', name: '1' },
		{ key: '2', label: '2', name: '2' },
		{ key: '3', label: '3', name: '3' },
		{ key: 'backspace', label: '⌫', name: 'Delete' },
		{ key: '4', label: '4', name: '4' },
		{ key: '5', label: '5', name: '5' },
		{ key: '6', label: '6', name: '6' },
		{ key: '+', label: '+', name: 'Add' },
		{ key: '7', label: '7', name: '7' },
		{ key: '8', label: '8', name: '8' },
		{ key: '9', label: '9', name: '9' },
		{ key: '-', label: '−', name: 'Subtract' },
		{ key: 'clear', label: 'C', name: 'Clear' },
		{ key: '0', label: '0', name: '0' },
		{ key: 'equals', label: '=', name: 'Equals' }
	];

	// The active chip stays in the row. Scrolling the page would shove the sheet around.
	$effect(() => {
		const node = scroller!;
		const chip = node.querySelectorAll('button')[active];
		node.scrollLeft = chipScrollLeft(
			node.scrollLeft,
			node.clientWidth,
			chip.offsetLeft,
			chip.offsetWidth
		);
	});
</script>

<div class="keypad" role="dialog" aria-label="Score keypad">
	<div class="bar">
		<div class="round {colour}">{round}</div>
		<div class="chips" bind:this={scroller}>
			{#each chips as chip, idx (idx)}
				<div class="chip-wrap {chip.colour}">
					<button
						type="button"
						class="chip"
						aria-pressed={idx === active}
						aria-label="{chip.label}, round {round}"
						onclick={() => onSelect(idx)}
					>
						<span class="who">{chip.label}</span>
						<span class="val">{chip.score}</span>
					</button>
				</div>
			{/each}
		</div>
		<button type="button" class="close" aria-label="Close keypad" onclick={onClose}>×</button>
	</div>

	<p class="readout" aria-live="polite">
		<span class="expr">{expression}</span>
		{#if preview !== null}<span class="result">{preview}</span>{/if}
	</p>

	<div class="keys">
		{#each keys as item (item.key)}
			<button type="button" class="key" aria-label={item.name} onclick={() => onKey(item.key)}>
				{#if item.key === 'backspace'}
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path
							fill="currentColor"
							d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"
						/>
					</svg>
				{:else}
					{item.label}
				{/if}
			</button>
		{/each}
		<button type="button" class="key next" aria-label="Next row" onclick={onNext}>Next</button>
	</div>
</div>

<style>
	.keypad {
		position: fixed;
		z-index: 5;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		max-height: 100dvh;
		overflow: auto;
		box-sizing: border-box;
		background: white;
		color: black;
		border-top: 1px solid black;
		padding-bottom: env(safe-area-inset-bottom);
		font-size: 1.125rem;
		box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.12);
		overscroll-behavior: contain;
	}

	.bar {
		display: flex;
		min-width: 0;
		border-bottom: 1px solid black;
	}

	.round,
	.close {
		flex: 0 0 2.75rem;
		width: 2.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 0;
		border-right: 1px solid black;
		color: inherit;
		font: inherit;
		font-weight: 600;
	}

	.close {
		border-right: 0;
		border-left: 1px solid black;
		background: white;
		cursor: pointer;
		font-size: 1.5rem;
		line-height: 1;
	}

	.chips {
		position: relative;
		display: flex;
		flex: 1;
		min-width: 0;
		overflow-x: auto;
	}

	.chip-wrap {
		flex: 1 0 4.75rem;
		min-width: 4.75rem;
		display: flex;
		border-right: 1px solid black;
	}

	.chip {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.1rem;
		min-width: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		padding: 0.35rem 0.2rem;
		cursor: pointer;
	}

	.chip[aria-pressed='true'] {
		outline: 2px solid black;
		outline-offset: -3px;
	}

	.who {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.75rem;
	}

	.val {
		min-height: 1.2em;
		font-size: 1.15rem;
		font-variant-numeric: tabular-nums;
	}

	.readout {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		min-height: 2.2rem;
		margin: 0;
		padding: 0.15rem 0.8rem;
		box-sizing: border-box;
		font-size: 1.35rem;
		font-variant-numeric: tabular-nums;
	}

	.expr {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.result {
		font-weight: 700;
	}

	.result::before {
		content: '= ';
		font-weight: 400;
	}

	.keys {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		border-top: 1px solid black;
	}

	.key {
		min-height: clamp(2.5rem, 9dvh, 3.4rem);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 0;
		border-right: 1px solid black;
		border-bottom: 1px solid black;
		background: white;
		color: inherit;
		font: inherit;
		font-size: 1.35rem;
		cursor: pointer;
		touch-action: manipulation;
	}

	.key svg {
		width: 1.25em;
		height: 1.25em;
		display: block;
	}

	.key:nth-child(4n) {
		border-right: 0;
		background: #f3f3f3;
	}

	.key:active {
		background: #e6e6e6;
	}

	.key.next {
		border-right: 0;
		background: #111;
		color: white;
		font-size: 1rem;
	}

	.key.next:active {
		background: #333;
	}
</style>
