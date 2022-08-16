<script lang="ts">

  import { onDestroy } from 'svelte';
  import {selectTextOnFocus, blurOnEscape} from '$lib/inputDirectives';
  
  type ScoreRow = string[]

  type Player = {
    name: string;
  }

  let currentPlayers: Player[] = [
    {name: 'P1'},
    {name: 'P2'},
  ]

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

  const setupPlayers = () => {
    scores = []
    for (let i = 2; i <= 14; i++) {
      addRow()
    }    
  }

  setupPlayers()


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

  const addPlayer = () => {
    console.log('adding a player?/...')
    currentPlayers = [...currentPlayers, {name: 'P' + (currentPlayers.length + 1).toString()}]
    for (let [idx, sr] of scores.entries()) {
      scores[idx] = [...sr, '']     
    }
    scores = [...scores]
  }



</script>

<svelte:head>
	<title>Score</title>
	<meta name="description" content="Score game" />
</svelte:head>

<section>
  <table>
    <thead>
      <td class="round" on:click={addPlayer}>+</td>
      {#each currentPlayers as player, idx}
        <td class="pcol player{idx}">
          <input type="text"
            bind:value={player.name}
            use:selectTextOnFocus 
            use:blurOnEscape
          >
      </td>
      {/each}       
      <!-- <td></td> -->
    </thead>

    <tbody>
     {#each scores as sr, idx}
      <tr>
        <td class="round player{idx % (currentPlayers.length)}">{rowLabel(idx + 2)}</td>
        {#each sr as score, idx }
          <td class="pcol player{idx}" >
            <input 
              type="tel" 
              bind:value={score}
              use:selectTextOnFocus 
              use:blurOnEscape
            >
          </td>
        {/each}   
        <!-- <td>{#if idx == scores.length - 1}<button on:click={addRow}>+</button>{/if}</td>        -->
      </tr>
     {/each}
    </tbody>

    <tfoot>
      <td class="round">Total:</td>
      {#each totals as total, idx}
        <td class="pcol player{idx}">{total}</td>
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

  table {
    max-width: 100%;
  }

  td {
    border: 1px solid black;
    text-align: center;
    padding: .25em;  
  }

  td.pcol {
    border: 1px solid black;
    text-align: center;
    padding: .25em;  
    /* width: auto; */
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