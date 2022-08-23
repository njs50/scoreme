<script lang="ts">
	import '../app.css';
</script>

<main>
	<slot />
</main>


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
