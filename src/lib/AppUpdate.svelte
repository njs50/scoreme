<script lang="ts">
	import { onMount } from 'svelte';
	import {
		readServedSha,
		reloadPage,
		requestServiceWorkerUpdate,
		updateAvailable,
		type ServiceWorkerUpdateTarget
	} from './appUpdate.ts';

	let {
		runningSha,
		versionUrl = 'version.json',
		intervalMs = 60_000,
		fetchImpl = globalThis.fetch,
		reload = reloadPage,
		serviceWorker = globalThis.navigator?.serviceWorker ?? null
	}: {
		runningSha: string;
		versionUrl?: string;
		intervalMs?: number;
		fetchImpl?: typeof fetch;
		reload?: () => void;
		serviceWorker?: ServiceWorkerUpdateTarget | null;
	} = $props();

	let available = $state(false);

	async function check() {
		await requestServiceWorkerUpdate(serviceWorker);
		const served = await readServedSha(fetchImpl, versionUrl);
		available = updateAvailable(runningSha, served);
	}

	onMount(() => {
		void check();
		const onVisible = () => {
			void check();
		};
		document.addEventListener('visibilitychange', onVisible);
		const timer = setInterval(() => {
			void check();
		}, intervalMs);
		return () => {
			document.removeEventListener('visibilitychange', onVisible);
			clearInterval(timer);
		};
	});
</script>

{#if available}
	<button type="button" class="update" onclick={() => reload()}>Click here to update</button>
{/if}

<style>
	.update {
		flex: none;
		margin: 0;
		border: 0;
		border-bottom: 1px solid black;
		padding: 0.55rem 1rem;
		background: black;
		color: white;
		font: inherit;
		font-size: 1rem;
		text-align: center;
		cursor: pointer;
	}
</style>
