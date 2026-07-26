import type { Species } from '../types/creature';

export const species: Species[] = [
  {
    id: 'pyrocub',
    name: 'Pyrocub',
    type: 'fire',
    baseStats: { hp: 40, atk: 9, def: 20, spd: 16 },
    moveIds: ['ember', 'flame_burst', 'tackle', 'quick_strike'],
    color: '#f97316',
    shape: 'circle',
  },
  {
    id: 'aquabub',
    name: 'Aquabub',
    type: 'water',
    baseStats: { hp: 44, atk: 8, def: 22, spd: 12 },
    moveIds: ['water_jet', 'bubble_beam', 'tackle', 'quick_strike'],
    color: '#38bdf8',
    shape: 'square',
  },
  {
    id: 'sprigling',
    name: 'Sprigling',
    type: 'grass',
    baseStats: { hp: 36, atk: 10, def: 18, spd: 18 },
    moveIds: ['vine_whip', 'leaf_storm', 'tackle', 'quick_strike'],
    color: '#4ade80',
    shape: 'triangle',
  },
  {
    id: 'tumbleroo',
    name: 'Tumbleroo',
    type: 'normal',
    baseStats: { hp: 46, atk: 9, def: 24, spd: 10 },
    moveIds: ['tackle', 'quick_strike', 'ember', 'water_jet'],
    color: '#a8a29e',
    shape: 'diamond',
  },
  {
    id: 'rivulon',
    name: 'Rivulon',
    type: 'water',
    baseStats: { hp: 34, atk: 8, def: 16, spd: 22 },
    moveIds: ['water_jet', 'bubble_beam', 'vine_whip', 'tackle'],
    color: '#0ea5e9',
    shape: 'circle',
  },
];
