export function calculateDamage(
  movePower: number,
  atk: number,
  def: number,
  typeMultiplier: number,
  gigantamaxMultiplier: number = 1,
): number {
  return Math.max(1, Math.floor((movePower * atk * typeMultiplier * gigantamaxMultiplier) / def));
}

/**
 * 速度更快的一方更可能先手，但结果被限制在 [0.2, 0.8] 区间内，
 * 保证再悬殊的速度差也保留至少 20% 的逆转概率。
 */
export function getTurnOrder(
  playerSpd: number,
  enemySpd: number,
  rng: () => number = Math.random,
): 'player' | 'enemy' {
  const totalSpd = playerSpd + enemySpd;
  const rawPlayerProbability = totalSpd > 0 ? playerSpd / totalSpd : 0.5;
  const playerProbability = Math.min(0.8, Math.max(0.2, rawPlayerProbability));
  return rng() < playerProbability ? 'player' : 'enemy';
}

export function rollHit(accuracy: number, rng: () => number = Math.random): boolean {
  return rng() < accuracy / 100;
}

export function pickEnemyMove(moveIds: string[], rng: () => number = Math.random): string {
  const index = Math.floor(rng() * moveIds.length);
  return moveIds[index];
}

/** 每场战斗、每只精灵登场时判定一次：1%~20% 概率触发极巨化。 */
export function rollGigantamax(rng: () => number = Math.random): boolean {
  const thresholdPercent = 1 + rng() * 19;
  const roll = rng() * 100;
  return roll < thresholdPercent;
}

/** 极巨化伤害加成倍率：50%~60%。 */
export function rollGigantamaxMultiplier(rng: () => number = Math.random): number {
  return 1.5 + rng() * 0.1;
}

/** 击倒野生精灵后，是否出现捕捉机会。 */
export function rollCatchOpportunity(rng: () => number = Math.random): boolean {
  return rng() < 0.5;
}

/** 捕捉尝试是否成功：60%~70% 概率。 */
export function rollCatchSuccess(rng: () => number = Math.random): boolean {
  const thresholdPercent = 60 + rng() * 10;
  const roll = rng() * 100;
  return roll < thresholdPercent;
}

/** 从候选池中采样 n 个 speciesId 组成敌方队伍；池子不够大时允许重复采样。 */
export function sampleTeam(pool: string[], n: number, rng: () => number = Math.random): string[] {
  if (pool.length === 0) return [];
  if (pool.length >= n) {
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, n);
  }
  const result: string[] = [];
  for (let i = 0; i < n; i++) {
    result.push(pool[Math.floor(rng() * pool.length)]);
  }
  return result;
}
