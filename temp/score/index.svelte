<script lang="ts">

  import { onDestroy } from 'svelte';

  import { playerStore, type Player } from '$lib/PlayerStore' 
  
  type ScoreRow = string[]

  let currentPlayers: Player[] = []

  let scores: ScoreRow[] = []

  const calcTotals = (scores: ScoreRow[]) => {
    let tr: number[] = []

    for (const player of currentPlayers ) {
      tr.push(0)
    } 
    
    for (const sr of scores ) {
      for (const idx in tr) {
        tr[idx] += parseInt(sr[idx]) | 0 
      }       
    }    
    
    console.log(tr)
    return tr
    
  }



  $: totals = calcTotals(scores)


  const addRow = ()=>{
    let sr: ScoreRow = []

    for (const player of currentPlayers ) {
      sr.push('')
    }

		scores = [...scores, sr]
	}

  const rowLabel = (idx: number) => {

    let label = ''
    // currentPlayers[(idx - 2) % (currentPlayers.length)].name.substring(0,3) + ' - '

    switch(idx) {
      case 11: 
        label += 'J';
        break;
      case 12: 
        label += 'Q';
        break;
      case 13: 
        label += 'K';
        break;
      case 14: 
        label += 'A';
        break;                
      default: label += idx.toString()

    }

    return label
  }


	const unsubscribe = playerStore.subscribe(players => {
    let cp = []
		for (const player of players) {
      if (player.active) {
        cp.push(player)
      }
    }
    currentPlayers = cp
    scores = []

    for (let i = 2; i <= 14; i++) {
      addRow()
    }

	});

	onDestroy(unsubscribe);

</script>

<svelte:head>
	<title>Score</title>
	<meta name="description" content="Score game" />
</svelte:head>

<section>
  <table>
    <thead>
      <td></td>
      {#each currentPlayers as player, idx (player.order)}
        <td class="player{idx}" contenteditable="true" bind:textContent={player.name}></td>
      {/each}       
      <!-- <td></td> -->
    </thead>

    <tbody>
     {#each scores as sr, idx}
      <tr>
        <td class="player{idx % (currentPlayers.length)}">{rowLabel(idx + 2)}</td>
        {#each sr as score, idx }
          <td class="player{idx}" contenteditable="true" bind:textContent={score}></td>
        {/each}   
        <!-- <td>{#if idx == scores.length - 1}<button on:click={addRow}>+</button>{/if}</td>        -->
      </tr>
     {/each}
    </tbody>

    <tfoot>
      <td>Total:</td>
      {#each totals as total, idx}
        <td class="player{idx}">{total}</td>
      {/each}     
      <!-- <td></td>       -->
    </tfoot>

  </table>
</section>



<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
	}

  td {
    border: 1px solid black;
    text-align: center;
    padding: .25em;  }

</style>