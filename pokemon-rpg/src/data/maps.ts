import type { MapDef, TileType } from '../types/map';
import { npcs } from './npcs';

// 图例: W=wall g=grass p=path t=tallgrass w=water
const LEGEND: Record<string, TileType> = {
  W: 'wall',
  g: 'grass',
  p: 'path',
  t: 'tallgrass',
  w: 'water',
};

// 14 宽 x 12 高。x=6 列是一条纵向 path 走廊，连接 NPC(6,2) 与出生点(6,8)。
// y=3..4 在走廊两侧各有一片 tallgrass（野生遭遇），y=6..7 在走廊两侧各有一片 water（碰撞演示）。
const ROWS = [
  'WWWWWWWWWWWWWW',
  'WggggggggggggW',
  'WgggggpggggggW',
  'WggtttptttgggW',
  'WggtttptttgggW',
  'WgggggpggggggW',
  'WgggwwpwwggggW',
  'WgggwwpwwggggW',
  'WgggggpggggggW',
  'WgggggpggggggW',
  'WgggggpggggggW',
  'WWWWWWWWWWWWWW',
];

const tiles: TileType[][] = ROWS.map((row) =>
  row.split('').map((ch) => LEGEND[ch]),
);

export const maps: Record<string, MapDef> = {
  route1: {
    id: 'route1',
    width: 14,
    height: 12,
    tileSize: 32,
    tiles,
    npcs,
    encounterSpeciesIds: ['sprigling', 'tumbleroo', 'rivulon'],
    encounterRate: 0.2,
    playerSpawn: { x: 6, y: 8 },
  },
};
