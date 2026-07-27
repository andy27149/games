export type ElementType = 'normal' | 'fire' | 'water' | 'grass' | 'dragon' | 'electric' | 'poison';

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface Species {
  id: string;
  name: string;
  type: ElementType;
  baseStats: Stats;
  moveIds: string[]; // 最多4个，固定技能组，v1无升级
  color: string; // 占位图形填色
  shape: 'circle' | 'square' | 'triangle' | 'diamond';
}

export interface Move {
  id: string;
  name: string;
  type: ElementType;
  power: number; // 状态类技能为0（v1暂不使用，字段先留出）
  accuracy: number; // 0-100
  category: 'physical' | 'special';
}

export interface CreatureInstance {
  speciesId: string;
  currentHp: number; // maxHp = species.baseStats.hp，无成长
}
