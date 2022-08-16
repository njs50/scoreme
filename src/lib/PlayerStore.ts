import { writable } from 'svelte/store'

export type Player = {
  created_at: Date;
  name: string;
  active: boolean;
  order: number;
};

const defaultPlayers: Player[] = [
  {name: 'Player 1', active: true, order: 0, created_at: new Date()},
  {name: 'Player 2', active: true, order: 1, created_at: new Date()},
]

export let playerStore = writable(defaultPlayers);