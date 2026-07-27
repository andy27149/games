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

// 24 宽 x 21 高。十字路网：纵向 path 在 x=12 贯穿全图，横向 path 在 y=10 贯穿全图，
// 交汇处 (12,10) 周围是一片开阔草地广场。四个象限各有一片 tallgrass（野生遭遇区），
// 右上角是一片较大的 water 湖泊，左上/右上角各有一处小屋墙体轮廓作为地标。
const ROWS = [
  'WWWWWWWWWWWWWWWWWWWWWWWW',
  'WgWWWWggggggpgggggWWWWgW',
  'WgWggWggggggpgggggWggWgW',
  'WgWWWWggggggpgggwwwwwwgW',
  'WggttttttgggpgggwwwwwwgW',
  'WggttttttgggpgggwwwwwwgW',
  'WggttttttgggpgggwwwwwwgW',
  'WggttttttgggpgggwwwwwwgW',
  'WgggggggggggpggggggggggW',
  'WgggggggggggpggggggggggW',
  'WppppppppppppppppppppppW',
  'WgggggggggggpggggggggggW',
  'WgggggggggggpggggggggggW',
  'WgggggggggggpggggggggggW',
  'WggttttttgggpgggttttttgW',
  'WggttttttgggpgggttttttgW',
  'WggttttttgggpgggttttttgW',
  'WggttttttgggpgggttttttgW',
  'WgggggggggggpggggggggggW',
  'WgggggggggggpggggggggggW',
  'WWWWWWWWWWWWWWWWWWWWWWWW',
];

const tiles: TileType[][] = ROWS.map((row) =>
  row.split('').map((ch) => LEGEND[ch]),
);

export const maps: Record<string, MapDef> = {
  route1: {
    id: 'route1',
    width: 24,
    height: 21,
    tileSize: 32,
    tiles,
    npcs,
    encounterSpeciesIds: ['sprigling', 'tumbleroo', 'rivulon', 'voltpup', 'toxinail'],
    encounterRate: 0.2,
    playerSpawn: { x: 11, y: 15 },
  },
};
