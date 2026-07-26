import type { ElementType } from '../types/creature';

// 攻击方类型 -> 防守方类型 -> 伤害倍率。未列出的组合视为中性 (1倍)。
// 火克草、水克火、草克水；normal 对任何属性都是中性。
const CHART: Partial<Record<ElementType, Partial<Record<ElementType, number>>>> = {
  fire: { grass: 2, water: 0.5 },
  water: { fire: 2, grass: 0.5 },
  grass: { water: 2, fire: 0.5 },
};

export function getTypeMultiplier(attackType: ElementType, defendType: ElementType): number {
  return CHART[attackType]?.[defendType] ?? 1;
}
