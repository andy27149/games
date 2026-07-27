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
  { id: 'kanglong_youhui', name: '亢龙有悔', type: 'dragon', power: 50, accuracy: 100, category: 'physical' },
  { id: 'longxiao_jiutian', name: '龙啸九天', type: 'dragon', power: 75, accuracy: 95, category: 'special' },
  { id: 'liuxing_qun', name: '流星群', type: 'dragon', power: 90, accuracy: 85, category: 'special' },
  { id: 'shiguang_paoxiao', name: '时光咆哮', type: 'dragon', power: 100, accuracy: 80, category: 'special' },
  { id: 'du_ya', name: '毒牙', type: 'poison', power: 50, accuracy: 100, category: 'physical' },
  { id: 'du_qi', name: '毒气', type: 'poison', power: 55, accuracy: 90, category: 'special' },
  { id: 'wuni_bo', name: '污泥波', type: 'poison', power: 65, accuracy: 95, category: 'special' },
  { id: 'heding_zhiye', name: '鹤顶之液', type: 'poison', power: 95, accuracy: 85, category: 'special' },
  { id: 'jiaocuo_shandian', name: '交错闪电', type: 'electric', power: 50, accuracy: 100, category: 'physical' },
  { id: 'poyin', name: '破音', type: 'electric', power: 60, accuracy: 95, category: 'special' },
  { id: 'shiwan_fute', name: '十万伏特', type: 'electric', power: 90, accuracy: 100, category: 'special' },
  { id: 'leiting_wanjun', name: '雷霆万钧', type: 'electric', power: 100, accuracy: 80, category: 'special' },
];
