export function calculateDamage(
  movePower: number,
  atk: number,
  def: number,
  typeMultiplier: number,
): number {
  return Math.max(1, Math.floor((movePower * atk * typeMultiplier) / def));
}

export function getTurnOrder(playerSpd: number, enemySpd: number): 'player' | 'enemy' {
  return playerSpd >= enemySpd ? 'player' : 'enemy';
}

export function rollHit(accuracy: number, rng: () => number = Math.random): boolean {
  return rng() < accuracy / 100;
}

export function pickEnemyMove(moveIds: string[], rng: () => number = Math.random): string {
  const index = Math.floor(rng() * moveIds.length);
  return moveIds[index];
}
