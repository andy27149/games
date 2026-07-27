import { describe, it, expect } from 'vitest';
import {
  calculateDamage,
  getTurnOrder,
  rollHit,
  pickEnemyMove,
  rollGigantamax,
  rollGigantamaxMultiplier,
  rollCatchOpportunity,
  sampleTeam,
} from './battleLogic';

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

  it('applies gigantamax multiplier on top of type multiplier', () => {
    expect(calculateDamage(40, 20, 20, 1, 1.5)).toBe(60);
  });

  it('defaults gigantamax multiplier to 1 when omitted', () => {
    expect(calculateDamage(40, 20, 20, 1)).toBe(calculateDamage(40, 20, 20, 1, 1));
  });
});

describe('getTurnOrder', () => {
  it('returns player when rng roll is below 0.5', () => {
    expect(getTurnOrder(() => 0.3)).toBe('player');
  });

  it('returns enemy when rng roll is at or above 0.5', () => {
    expect(getTurnOrder(() => 0.7)).toBe('enemy');
  });

  it('is a 50/50 boundary at exactly 0.5', () => {
    expect(getTurnOrder(() => 0.5)).toBe('enemy');
    expect(getTurnOrder(() => 0.4999)).toBe('player');
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

describe('rollGigantamax', () => {
  it('triggers when the roll lands below the rolled threshold', () => {
    // first rng() call sets threshold to 1 + 0*19 = 1; second call rolls 0 * 100 = 0, which is < 1
    expect(rollGigantamax(() => 0)).toBe(true);
  });

  it('does not trigger when the roll lands above the max possible threshold', () => {
    // threshold maxes out at 20; a roll of 0.99*100=99 will never be below it
    expect(rollGigantamax(() => 0.99)).toBe(false);
  });
});

describe('rollGigantamaxMultiplier', () => {
  it('returns the minimum multiplier when rng is 0', () => {
    expect(rollGigantamaxMultiplier(() => 0)).toBeCloseTo(1.5);
  });

  it('returns the maximum multiplier when rng approaches 1', () => {
    expect(rollGigantamaxMultiplier(() => 1)).toBeCloseTo(1.6);
  });
});

describe('rollCatchOpportunity', () => {
  it('triggers when rng roll is below 0.4', () => {
    expect(rollCatchOpportunity(() => 0.1)).toBe(true);
  });

  it('does not trigger when rng roll is at or above 0.4', () => {
    expect(rollCatchOpportunity(() => 0.4)).toBe(false);
    expect(rollCatchOpportunity(() => 0.9)).toBe(false);
  });
});

describe('sampleTeam', () => {
  it('returns n distinct entries when the pool is large enough', () => {
    const result = sampleTeam(['a', 'b', 'c', 'd'], 3, () => 0);
    expect(result).toHaveLength(3);
    expect(new Set(result).size).toBe(3);
  });

  it('allows repeats when the pool is smaller than n', () => {
    const result = sampleTeam(['a'], 3, () => 0);
    expect(result).toEqual(['a', 'a', 'a']);
  });

  it('returns an empty array for an empty pool', () => {
    expect(sampleTeam([], 3, () => 0)).toEqual([]);
  });
});
