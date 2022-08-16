<script lang="ts">

  
  import PlayerList from './PlayerList.svelte';
  import PlayerEditor from './PlayerEditor.svelte';


</script>

<svelte:head>
	<title>Players</title>
	<meta name="description" content="Configure players" />
</svelte:head>

<section>

    <PlayerList />
    <PlayerEditor />

</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
	}

</style>
