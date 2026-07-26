import { create } from 'zustand';
import { usePlayerStore } from './usePlayerStore';
import { useCoordinator } from './coordinator';
import { species } from '../data/species';
import { moves } from '../data/moves';
import { getTypeMultiplier } from '../data/typeChart';
import { calculateDamage, getTurnOrder, rollHit, pickEnemyMove } from '../battle/battleLogic';
import type { Species, Move, CreatureInstance } from '../types/creature';

/** resolving: 回合正在分步结算中，此时应屏蔽所有操作按钮。 */
export type BattlePhase = 'choose' | 'resolving' | 'forceSwitch' | 'ended';
export type BattleOutcome = 'win' | 'lose' | 'flee' | 'caught' | null;

const RESOLVE_STEP_DELAY_MS = 900;

interface BattleState {
  enemySpeciesId: string;
  enemyHp: number;
  enemyMaxHp: number;
  activeIndex: number;
  log: string[];
  phase: BattlePhase;
  outcome: BattleOutcome;

  startBattle: (enemySpeciesId: string) => void;
  chooseMove: (moveId: string) => void;
  switchActive: (index: number) => void;
  attemptCatch: () => void;
  flee: () => void;
  acknowledgeEnd: () => void;
}

function getSpecies(speciesId: string): Species {
  const found = species.find((s) => s.id === speciesId);
  if (!found) {
    throw new Error(`Unknown species id: ${speciesId}`);
  }
  return found;
}

function getMove(moveId: string): Move {
  const found = moves.find((m) => m.id === moveId);
  if (!found) {
    throw new Error(`Unknown move id: ${moveId}`);
  }
  return found;
}

function firstAliveIndex(): number {
  const party = usePlayerStore.getState().party;
  const index = party.findIndex((c) => c.currentHp > 0);
  return index >= 0 ? index : 0;
}

/** 一次行动结算之后，根据双方血量决定下一阶段：胜利/强制换人/失败/继续选择指令。 */
function resolvePostAction(
  enemyHp: number,
  activeIndex: number,
): Pick<BattleState, 'phase' | 'outcome'> {
  if (enemyHp <= 0) {
    return { phase: 'ended', outcome: 'win' };
  }
  const party = usePlayerStore.getState().party;
  const activeCreature = party[activeIndex];
  if (activeCreature.currentHp <= 0) {
    const hasReserve = party.some((c, i) => i !== activeIndex && c.currentHp > 0);
    if (hasReserve) {
      return { phase: 'forceSwitch', outcome: null };
    }
    return { phase: 'ended', outcome: 'lose' };
  }
  return { phase: 'choose', outcome: null };
}

export const useBattleStore = create<BattleState>((set, get) => ({
  enemySpeciesId: '',
  enemyHp: 0,
  enemyMaxHp: 0,
  activeIndex: 0,
  log: [],
  phase: 'choose',
  outcome: null,

  startBattle: (enemySpeciesId) => {
    const enemySpecies = getSpecies(enemySpeciesId);
    const activeIndex = firstAliveIndex();
    const activeSpecies = getSpecies(usePlayerStore.getState().party[activeIndex].speciesId);
    set({
      enemySpeciesId,
      enemyHp: enemySpecies.baseStats.hp,
      enemyMaxHp: enemySpecies.baseStats.hp,
      activeIndex,
      log: [`野生的 ${enemySpecies.name} 出现了！轮到 ${activeSpecies.name} 上场！`],
      phase: 'choose',
      outcome: null,
    });
  },

  chooseMove: (moveId) => {
    const state = get();
    if (state.phase !== 'choose') return;

    const activeIndex = state.activeIndex;
    const playerCreature = usePlayerStore.getState().party[activeIndex];
    const playerSpecies = getSpecies(playerCreature.speciesId);
    const playerMove = getMove(moveId);

    const enemySpecies = getSpecies(state.enemySpeciesId);
    const enemyMoveId = pickEnemyMove(enemySpecies.moveIds);
    const enemyMove = getMove(enemyMoveId);

    const firstIsPlayer = getTurnOrder(playerSpecies.baseStats.spd, enemySpecies.baseStats.spd) === 'player';

    /** 玩家出招：读取/写入 store 里的最新 enemyHp，返回敌方是否倒下。 */
    const playerAttackStep = (): boolean => {
      const enemyHp = get().enemyHp;
      if (!rollHit(playerMove.accuracy)) {
        set((s) => ({ log: [...s.log, `${playerSpecies.name} 使用了 ${playerMove.name}，但没有命中！`] }));
        return false;
      }
      const multiplier = getTypeMultiplier(playerMove.type, enemySpecies.type);
      const damage = calculateDamage(
        playerMove.power,
        playerSpecies.baseStats.atk,
        enemySpecies.baseStats.def,
        multiplier,
      );
      const newHp = Math.max(0, enemyHp - damage);
      set((s) => ({
        enemyHp: newHp,
        log: [...s.log, `${playerSpecies.name} 使用了 ${playerMove.name}，造成 ${damage} 点伤害！`],
      }));
      return newHp <= 0;
    };

    /** 敌方出招：读取/写入玩家最新 HP，返回出战精灵是否倒下。 */
    const enemyAttackStep = (): boolean => {
      if (!rollHit(enemyMove.accuracy)) {
        set((s) => ({ log: [...s.log, `${enemySpecies.name} 使用了 ${enemyMove.name}，但没有命中！`] }));
        return false;
      }
      const multiplier = getTypeMultiplier(enemyMove.type, playerSpecies.type);
      const damage = calculateDamage(
        enemyMove.power,
        enemySpecies.baseStats.atk,
        playerSpecies.baseStats.def,
        multiplier,
      );
      const currentHp = usePlayerStore.getState().party[activeIndex].currentHp;
      const newHp = Math.max(0, currentHp - damage);
      usePlayerStore.getState().updateCreatureHp(activeIndex, newHp);
      set((s) => ({ log: [...s.log, `${enemySpecies.name} 使用了 ${enemyMove.name}，造成 ${damage} 点伤害！`] }));
      return newHp <= 0;
    };

    const firstLine = firstIsPlayer
      ? `${playerSpecies.name} 速度更快，率先出手！`
      : `${enemySpecies.name} 速度更快，抢先出手！`;

    set((s) => ({ log: [...s.log, firstLine], phase: 'resolving' }));

    const [firstStep, secondStep] = firstIsPlayer
      ? [playerAttackStep, enemyAttackStep]
      : [enemyAttackStep, playerAttackStep];

    setTimeout(() => {
      const firstFainted = firstStep();
      if (firstFainted) {
        set(resolvePostAction(get().enemyHp, activeIndex));
        return;
      }
      setTimeout(() => {
        secondStep();
        set(resolvePostAction(get().enemyHp, activeIndex));
      }, RESOLVE_STEP_DELAY_MS);
    }, RESOLVE_STEP_DELAY_MS);
  },

  switchActive: (index) => {
    const state = get();
    if (state.phase === 'forceSwitch') {
      set({ activeIndex: index, phase: 'choose' });
      return;
    }
    if (state.phase !== 'choose') return;

    const enemySpecies = getSpecies(state.enemySpeciesId);
    const playerCreature = usePlayerStore.getState().party[index];
    const playerSpecies = getSpecies(playerCreature.speciesId);
    const log: string[] = [...state.log, `派出了 ${playerSpecies.name}！`];

    const enemyMoveId = pickEnemyMove(enemySpecies.moveIds);
    const enemyMove = getMove(enemyMoveId);

    if (!rollHit(enemyMove.accuracy)) {
      log.push(`${enemySpecies.name} 使用了 ${enemyMove.name}，但没有命中！`);
    } else {
      const multiplier = getTypeMultiplier(enemyMove.type, playerSpecies.type);
      const damage = calculateDamage(
        enemyMove.power,
        enemySpecies.baseStats.atk,
        playerSpecies.baseStats.def,
        multiplier,
      );
      const newHp = Math.max(0, playerCreature.currentHp - damage);
      usePlayerStore.getState().updateCreatureHp(index, newHp);
      log.push(`${enemySpecies.name} 使用了 ${enemyMove.name}，造成 ${damage} 点伤害！`);
    }

    set({ activeIndex: index, log, ...resolvePostAction(state.enemyHp, index) });
  },

  attemptCatch: () => {
    const state = get();
    if (state.phase !== 'choose') return;
    if (!useCoordinator.getState().battleContext?.isWild) return;

    const activeIndex = state.activeIndex;
    const enemySpecies = getSpecies(state.enemySpeciesId);
    const chance = Math.floor(Math.random() * 100) + 1;

    set((s) => ({
      log: [...s.log, `你向 ${enemySpecies.name} 投出了精灵球！`],
      phase: 'resolving',
    }));

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 100) + 1;
      const success = roll <= chance;

      if (success) {
        const caught: CreatureInstance = { speciesId: state.enemySpeciesId, currentHp: enemySpecies.baseStats.hp };
        usePlayerStore.getState().setParty([...usePlayerStore.getState().party, caught]);
        set((s) => ({
          log: [...s.log, `收服成功！${enemySpecies.name} 加入了队伍！`],
          phase: 'ended',
          outcome: 'caught',
        }));
        return;
      }

      set((s) => ({ log: [...s.log, `糟糕，${enemySpecies.name} 挣脱了精灵球……`] }));

      const enemyMoveId = pickEnemyMove(enemySpecies.moveIds);
      const enemyMove = getMove(enemyMoveId);
      const playerCreature = usePlayerStore.getState().party[activeIndex];
      const playerSpecies = getSpecies(playerCreature.speciesId);

      if (!rollHit(enemyMove.accuracy)) {
        set((s) => ({
          log: [...s.log, `${enemySpecies.name} 使用了 ${enemyMove.name}，但没有命中！`],
          ...resolvePostAction(get().enemyHp, activeIndex),
        }));
        return;
      }

      const multiplier = getTypeMultiplier(enemyMove.type, playerSpecies.type);
      const damage = calculateDamage(
        enemyMove.power,
        enemySpecies.baseStats.atk,
        playerSpecies.baseStats.def,
        multiplier,
      );
      const newHp = Math.max(0, playerCreature.currentHp - damage);
      usePlayerStore.getState().updateCreatureHp(activeIndex, newHp);
      set((s) => ({
        log: [...s.log, `${enemySpecies.name} 使用了 ${enemyMove.name}，造成 ${damage} 点伤害！`],
        ...resolvePostAction(get().enemyHp, activeIndex),
      }));
    }, RESOLVE_STEP_DELAY_MS);
  },

  flee: () => {
    const state = get();
    set({ phase: 'ended', outcome: 'flee', log: [...state.log, '成功逃跑了！'] });
  },

  acknowledgeEnd: () => {
    const outcome = get().outcome;
    if (outcome) {
      useCoordinator.getState().exitBattle(outcome);
    }
    set({
      enemySpeciesId: '',
      enemyHp: 0,
      enemyMaxHp: 0,
      activeIndex: 0,
      log: [],
      phase: 'choose',
      outcome: null,
    });
  },
}));
