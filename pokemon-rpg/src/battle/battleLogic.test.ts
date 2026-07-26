import { describe, it, expect } from 'vitest';
import { calculateDamage, getTurnOrder, rollHit, pickEnemyMove } from './battleLogic';

describe('calculateDamage', () => {
  it('applies neutral type multiplier', () => {
    expect(calculateDamage(40, 20, 20, 1)).toBe(40);
  });

  it('applies super-effective (2x) type multiplier', () => {
    expect(calculateDamage(40, 20, 20, 2)).toBe(80);
  });

  it('applies not-very-effective (0.5x) type multiplier', () => {
    expect(calculateDamage(40, 20, 20, 0.5)).toBe(20);
  });

  it('floors fractional results', () => {
    expect(calculateDamage(35, 9, 20, 1)).toBe(15);
  });

  it('never returns less than 1 damage', () => {
    expect(calculateDamage(1, 1, 1000, 0.5)).toBe(1);
  });
});

describe('getTurnOrder', () => {
  it('player goes first when faster', () => {
    expect(getTurnOrder(20, 10)).toBe('player');
  });

  it('enemy goes first when faster', () => {
    expect(getTurnOrder(10, 20)).toBe('enemy');
  });

  it('player goes first on a speed tie', () => {
    expect(getTurnOrder(15, 15)).toBe('player');
  });
});

describe('rollHit', () => {
  it('hits when rng roll is below accuracy threshold', () => {
    expect(rollHit(90, () => 0.1)).toBe(true);
  });

  it('misses when rng roll is above accuracy threshold', () => {
    expect(rollHit(90, () => 0.95)).toBe(false);
  });

  it('treats accuracy as a percentage boundary', () => {
    expect(rollHit(50, () => 0.49)).toBe(true);
    expect(rollHit(50, () => 0.5)).toBe(false);
  });
});

describe('pickEnemyMove', () => {
  it('picks the first move when rng returns 0', () => {
    expect(pickEnemyMove(['ember', 'tackle', 'quick_strike'], () => 0)).toBe('ember');
  });

  it('picks the last move when rng returns just under 1', () => {
    expect(pickEnemyMove(['ember', 'tackle', 'quick_strike'], () => 0.999)).toBe('quick_strike');
  });

  it('picks the middle move for a mid-range roll', () => {
    expect(pickEnemyMove(['ember', 'tackle', 'quick_strike'], () => 0.5)).toBe('tackle');
  });
});
