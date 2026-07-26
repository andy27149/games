import type { Move } from '../types/creature';

export const moves: Move[] = [
  { id: 'ember', name: '火花', type: 'fire', power: 40, accuracy: 100, category: 'physical' },
  { id: 'flame_burst', name: '爆炎', type: 'fire', power: 60, accuracy: 90, category: 'special' },
  { id: 'water_jet', name: '水流喷射', type: 'water', power: 40, accuracy: 100, category: 'physical' },
  { id: 'bubble_beam', name: '泡沫光线', type: 'water', power: 60, accuracy: 90, category: 'special' },
  { id: 'vine_whip', name: '藤鞭', type: 'grass', power: 40, accuracy: 100, category: 'physical' },
  { id: 'leaf_storm', name: '飞叶风暴', type: 'grass', power: 60, accuracy: 85, category: 'special' },
  { id: 'tackle', name: '撞击', type: 'normal', power: 35, accuracy: 100, category: 'physical' },
  { id: 'quick_strike', name: '疾风拳', type: 'normal', power: 50, accuracy: 95, category: 'physical' },
];
