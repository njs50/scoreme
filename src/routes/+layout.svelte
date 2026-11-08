<script lang="ts">
	import '../app.css';
	import { previewLabel } from '#lib/preview.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Only preview-deploy.yml sets these; production stays blank.
	const previewWatermark = previewLabel(__PREVIEW_REF__, __PREVIEW_SHA__);
</script>

<main>
	{@render children()}
</main>

{#if previewWatermark}
	<div class="preview-watermark" aria-hidden="true">{previewWatermark}</div>
{/if}

<style>
	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0.5rem;
		width: 100%;
		max-width: 1024px;
		margin: 0 auto;
		box-sizing: border-box;
	}

	.preview-watermark {
		position: fixed;
		left: 8px;
		bottom: 6px;
		z-index: 9999;
		pointer-events: none;
		font:
			10px/1.2 ui-monospace,
			SFMono-Regular,
			Menlo,
			Consolas,
			monospace;
		color: rgba(0, 0, 0, 0.45);
	}
</style>
