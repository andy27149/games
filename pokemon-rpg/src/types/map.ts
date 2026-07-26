export type TileType = 'grass' | 'path' | 'water' | 'wall' | 'tallgrass';

export interface NpcPlacement {
  id: string;
  x: number;
  y: number;
  dialogueId: string;
  color: string;
}

export interface MapDef {
  id: string;
  width: number;
  height: number;
  tileSize: number;
  tiles: TileType[][]; // [y][x]
  npcs: NpcPlacement[];
  encounterSpeciesIds: string[]; // 该地图野生精灵池
  encounterRate: number; // 每步在tallgrass触发遭遇的概率 0-1
  playerSpawn: { x: number; y: number };
}
