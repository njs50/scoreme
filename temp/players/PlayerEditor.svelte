<script type="ts">
	import { playerStore } from '$lib/PlayerStore' 
	
  let playerName: string;

	const addNew = ()=>{
		$playerStore = [...$playerStore,{name:playerName, created_at: new Date(), active: false, order: $playerStore.length},];
	}

</script>

<div>
	<input type="text" bind:value={playerName} placeholder="Player Name"/>
	<button on:click={addNew}>+ Add Player</button>
</div>