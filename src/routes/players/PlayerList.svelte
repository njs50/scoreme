<script type="ts">
  import { playerStore } from '$lib/PlayerStore' 
 </script>

 <ul>
  {#each $playerStore as player, idx}
   <li class="player{idx}"><input type="checkbox" bind:checked={player.active} /> {player.name}</li>
  {/each} 
 </ul>

