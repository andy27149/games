import type { ElementType } from '../types/creature';

// 攻击方类型 -> 防守方类型 -> 伤害倍率。未列出的组合视为中性 (1倍)。
// 电克水、水克草、草克毒、毒克火、火克电；龙克普通/火/水/草/电，毒克龙；normal 对任何属性都是中性。
const CHART: Partial<Record<ElementType, Partial<Record<ElementType, number>>>> = {
  electric: { water: 2, fire: 0.5, dragon: 0.5 },
  water: { grass: 2, electric: 0.5, dragon: 0.5 },
  grass: { poison: 2, water: 0.5, dragon: 0.5 },
  poison: { fire: 2, grass: 0.5, dragon: 2 },
  fire: { electric: 2, poison: 0.5, dragon: 0.5 },
  dragon: { normal: 2, fire: 2, water: 2, grass: 2, electric: 2, poison: 0.5 },
  normal: { dragon: 0.5 },
};

export function getTypeMultiplier(attackType: ElementType, defendType: ElementType): number {
  return CHART[attackType]?.[defendType] ?? 1;
}
