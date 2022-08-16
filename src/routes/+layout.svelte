<script lang="ts">
	// import Header from '$lib/header/Header.svelte';
	import '../app.css';
</script>
<!-- 
<Header /> -->

<main>
	<slot />
</main>
<!-- 
<footer>
	<p>github link</p>
</footer> -->

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

</style>
