import { create } from 'zustand';
import { usePlayerStore } from './usePlayerStore';
import { useCoordinator } from './coordinator';
import { species } from '../data/species';
import { moves } from '../data/moves';
import { getTypeMultiplier } from '../data/typeChart';
import {
  calculateDamage,
  getTurnOrder,
  rollHit,
  pickEnemyMove,
  rollGigantamax,
  rollGigantamaxMultiplier,
  rollCatchOpportunity,
  rollCatchSuccess,
  sampleTeam,
} from '../battle/battleLogic';
import type { Species, Move, CreatureInstance } from '../types/creature';

/** resolving: 回合正在分步结算中，此时应屏蔽所有操作按钮。 */
export type BattlePhase = 'choose' | 'resolving' | 'forceSwitch' | 'catchOpportunity' | 'ended';
export type BattleOutcome = 'win' | 'lose' | 'flee' | 'caught' | null;

export interface EnemySlot {
  speciesId: string;
  currentHp: number;
  maxHp: number;
}

interface GigantamaxStatus {
  active: boolean;
  multiplier: number;
}

const RESOLVE_STEP_DELAY_MS = 900;

interface BattleState {
  enemyTeam: EnemySlot[];
  enemyActiveSlot: number;
  playerTeamIndices: number[]; // 指向 usePlayerStore.party 的下标
  activeTeamSlot: number; // 下标指向 playerTeamIndices
  playerGigantamax: Record<number, GigantamaxStatus>; // key: 队伍槽位（playerTeamIndices 的下标）
  enemyGigantamax: Record<number, GigantamaxStatus>; // key: enemyTeam 的下标
  log: string[];
  phase: BattlePhase;
  outcome: BattleOutcome;

  sampleEnemyTeam: (pool: string[], n: number) => string[];
  startBattle: (playerTeamIndices: number[], enemyTeamSpeciesIds: string[]) => void;
  chooseMove: (moveId: string) => void;
  switchActive: (teamSlot: number) => void;
  attemptCatch: () => void;
  skipCatchOpportunity: () => void;
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

function firstAliveTeamSlot(playerTeamIndices: number[]): number {
  const party = usePlayerStore.getState().party;
  const slot = playerTeamIndices.findIndex((partyIndex) => party[partyIndex].currentHp > 0);
  return slot >= 0 ? slot : 0;
}

const GIGANTAMAX_LOG_LINE = '这只宝可梦触发了极巨化！';

export const useBattleStore = create<BattleState>((set, get) => {
  /** 一次行动结算完毕后，检查敌我双方是否倒下并决定下一阶段。 */
  function resolveAfterAction(): void {
    const state = get();
    const partyIndex = state.playerTeamIndices[state.activeTeamSlot];
    const enemySlot = state.enemyTeam[state.enemyActiveSlot];
    const playerHp = usePlayerStore.getState().party[partyIndex].currentHp;

    if (enemySlot.currentHp <= 0) {
      handleEnemyDefeated();
      return;
    }
    if (playerHp <= 0) {
      handlePlayerFainted();
      return;
    }
    set({ phase: 'choose' });
  }

  /** 敌方当前槽位刚刚倒下：野生战有概率出现捕捉机会，否则直接换下一个槽位或宣告胜利。 */
  function handleEnemyDefeated(): void {
    const state = get();
    const isWild = useCoordinator.getState().battleContext?.isWild ?? false;
    const enemySpecies = getSpecies(state.enemyTeam[state.enemyActiveSlot].speciesId);

    if (isWild && rollCatchOpportunity()) {
      set((s) => ({
        phase: 'catchOpportunity',
        log: [...s.log, `野生的 ${enemySpecies.name} 似乎露出了破绽！`],
      }));
      return;
    }

    advanceEnemyOrFinish('win');
  }

  /** 换上敌方下一个存活槽位；若没有则以给定结果结束战斗。 */
  function advanceEnemyOrFinish(finishOutcome: 'win' | 'caught'): void {
    const state = get();
    const nextSlot = state.enemyTeam.findIndex(
      (slot, i) => i > state.enemyActiveSlot && slot.currentHp > 0,
    );

    if (nextSlot === -1) {
      set({ phase: 'ended', outcome: finishOutcome });
      return;
    }

    const nextSpecies = getSpecies(state.enemyTeam[nextSlot].speciesId);
    const gmxLine = state.enemyGigantamax[nextSlot]?.active ? [GIGANTAMAX_LOG_LINE] : [];
    set((s) => ({
      enemyActiveSlot: nextSlot,
      phase: 'choose',
      log: [...s.log, `对方派出了 ${nextSpecies.name}！`, ...gmxLine],
    }));
  }

  /** 玩家出战精灵倒下：有后备则强制换人，否则战斗失败。 */
  function handlePlayerFainted(): void {
    const state = get();
    const party = usePlayerStore.getState().party;
    const hasReserve = state.playerTeamIndices.some(
      (partyIndex, slot) => slot !== state.activeTeamSlot && party[partyIndex].currentHp > 0,
    );
    if (hasReserve) {
      set({ phase: 'forceSwitch' });
    } else {
      set({ phase: 'ended', outcome: 'lose' });
    }
  }

  return {
    enemyTeam: [],
    enemyActiveSlot: 0,
    playerTeamIndices: [],
    activeTeamSlot: 0,
    playerGigantamax: {},
    enemyGigantamax: {},
    log: [],
    phase: 'choose',
    outcome: null,

    sampleEnemyTeam: (pool, n) => sampleTeam(pool, n),

    startBattle: (playerTeamIndices, enemyTeamSpeciesIds) => {
      const enemyTeam: EnemySlot[] = enemyTeamSpeciesIds.map((id) => {
        const sp = getSpecies(id);
        return { speciesId: id, currentHp: sp.baseStats.hp, maxHp: sp.baseStats.hp };
      });

      const playerGigantamax: Record<number, GigantamaxStatus> = {};
      playerTeamIndices.forEach((_partyIndex, slot) => {
        const active = rollGigantamax();
        playerGigantamax[slot] = { active, multiplier: active ? rollGigantamaxMultiplier() : 1 };
      });

      const enemyGigantamax: Record<number, GigantamaxStatus> = {};
      enemyTeam.forEach((_slot, i) => {
        const active = rollGigantamax();
        enemyGigantamax[i] = { active, multiplier: active ? rollGigantamaxMultiplier() : 1 };
      });

      const activeTeamSlot = firstAliveTeamSlot(playerTeamIndices);
      const enemyActiveSlot = 0;

      const activeSpecies = getSpecies(
        usePlayerStore.getState().party[playerTeamIndices[activeTeamSlot]].speciesId,
      );
      const enemySpecies = getSpecies(enemyTeam[enemyActiveSlot].speciesId);

      const gigantamaxLines: string[] = [];
      if (enemyGigantamax[enemyActiveSlot]?.active) gigantamaxLines.push(GIGANTAMAX_LOG_LINE);
      if (playerGigantamax[activeTeamSlot]?.active) gigantamaxLines.push(GIGANTAMAX_LOG_LINE);

      const isWild = useCoordinator.getState().battleContext?.isWild ?? false;
      const appearLine = isWild
        ? `野生的 ${enemySpecies.name} 出现了！轮到 ${activeSpecies.name} 上场！`
        : `对方派出了 ${enemySpecies.name}！轮到 ${activeSpecies.name} 上场！`;

      set({
        enemyTeam,
        enemyActiveSlot,
        playerTeamIndices,
        activeTeamSlot,
        playerGigantamax,
        enemyGigantamax,
        log: [appearLine, ...gigantamaxLines],
        phase: 'choose',
        outcome: null,
      });
    },

    chooseMove: (moveId) => {
      const state = get();
      if (state.phase !== 'choose') return;

      const activeTeamSlot = state.activeTeamSlot;
      const partyIndex = state.playerTeamIndices[activeTeamSlot];
      const playerCreature = usePlayerStore.getState().party[partyIndex];
      const playerSpecies = getSpecies(playerCreature.speciesId);
      const playerMove = getMove(moveId);

      const enemyActiveSlot = state.enemyActiveSlot;
      const enemySpecies = getSpecies(state.enemyTeam[enemyActiveSlot].speciesId);
      const enemyMoveId = pickEnemyMove(enemySpecies.moveIds);
      const enemyMove = getMove(enemyMoveId);

      const playerGmx = state.playerGigantamax[activeTeamSlot];
      const enemyGmx = state.enemyGigantamax[enemyActiveSlot];

      const firstIsPlayer = getTurnOrder() === 'player';

      /** 玩家出招：读取/写入 store 里的最新敌方槽位血量。 */
      const playerAttackStep = (): void => {
        const enemyHp = get().enemyTeam[enemyActiveSlot].currentHp;
        if (!rollHit(playerMove.accuracy)) {
          set((s) => ({ log: [...s.log, `${playerSpecies.name} 使用了 ${playerMove.name}，但没有命中！`] }));
          return;
        }
        const multiplier = getTypeMultiplier(playerMove.type, enemySpecies.type);
        const damage = calculateDamage(
          playerMove.power,
          playerSpecies.baseStats.atk,
          enemySpecies.baseStats.def,
          multiplier,
          playerGmx?.active ? playerGmx.multiplier : 1,
        );
        const newHp = Math.max(0, enemyHp - damage);
        set((s) => ({
          enemyTeam: s.enemyTeam.map((slot, i) => (i === enemyActiveSlot ? { ...slot, currentHp: newHp } : slot)),
          log: [...s.log, `${playerSpecies.name} 使用了 ${playerMove.name}，造成 ${damage} 点伤害！`],
        }));
      };

      /** 敌方出招：读取/写入玩家最新出战精灵血量。 */
      const enemyAttackStep = (): void => {
        if (!rollHit(enemyMove.accuracy)) {
          set((s) => ({ log: [...s.log, `${enemySpecies.name} 使用了 ${enemyMove.name}，但没有命中！`] }));
          return;
        }
        const multiplier = getTypeMultiplier(enemyMove.type, playerSpecies.type);
        const damage = calculateDamage(
          enemyMove.power,
          enemySpecies.baseStats.atk,
          playerSpecies.baseStats.def,
          multiplier,
          enemyGmx?.active ? enemyGmx.multiplier : 1,
        );
        const currentHp = usePlayerStore.getState().party[partyIndex].currentHp;
        const newHp = Math.max(0, currentHp - damage);
        usePlayerStore.getState().updateCreatureHp(partyIndex, newHp);
        set((s) => ({ log: [...s.log, `${enemySpecies.name} 使用了 ${enemyMove.name}，造成 ${damage} 点伤害！`] }));
      };

      const firstLine = firstIsPlayer
        ? `${playerSpecies.name} 抢先出手！`
        : `${enemySpecies.name} 抢先出手！`;

      set((s) => ({ log: [...s.log, firstLine], phase: 'resolving' }));

      const [firstStep, secondStep] = firstIsPlayer
        ? [playerAttackStep, enemyAttackStep]
        : [enemyAttackStep, playerAttackStep];

      setTimeout(() => {
        firstStep();
        const enemyFainted = get().enemyTeam[enemyActiveSlot].currentHp <= 0;
        const playerFainted = usePlayerStore.getState().party[partyIndex].currentHp <= 0;
        if (enemyFainted || playerFainted) {
          resolveAfterAction();
          return;
        }
        setTimeout(() => {
          secondStep();
          resolveAfterAction();
        }, RESOLVE_STEP_DELAY_MS);
      }, RESOLVE_STEP_DELAY_MS);
    },

    switchActive: (teamSlot) => {
      const state = get();

      if (state.phase === 'forceSwitch') {
        const partyIndex = state.playerTeamIndices[teamSlot];
        const sp = getSpecies(usePlayerStore.getState().party[partyIndex].speciesId);
        const gmxLine = state.playerGigantamax[teamSlot]?.active ? [GIGANTAMAX_LOG_LINE] : [];
        set((s) => ({
          activeTeamSlot: teamSlot,
          phase: 'choose',
          log: [...s.log, `派出了 ${sp.name}！`, ...gmxLine],
        }));
        return;
      }
      if (state.phase !== 'choose') return;

      const enemySpecies = getSpecies(state.enemyTeam[state.enemyActiveSlot].speciesId);
      const partyIndex = state.playerTeamIndices[teamSlot];
      const playerCreature = usePlayerStore.getState().party[partyIndex];
      const playerSpecies = getSpecies(playerCreature.speciesId);
      const gmxLine = state.playerGigantamax[teamSlot]?.active ? [GIGANTAMAX_LOG_LINE] : [];
      const log: string[] = [...state.log, `派出了 ${playerSpecies.name}！`, ...gmxLine];

      const enemyMoveId = pickEnemyMove(enemySpecies.moveIds);
      const enemyMove = getMove(enemyMoveId);
      const enemyGmx = state.enemyGigantamax[state.enemyActiveSlot];

      if (!rollHit(enemyMove.accuracy)) {
        log.push(`${enemySpecies.name} 使用了 ${enemyMove.name}，但没有命中！`);
      } else {
        const multiplier = getTypeMultiplier(enemyMove.type, playerSpecies.type);
        const damage = calculateDamage(
          enemyMove.power,
          enemySpecies.baseStats.atk,
          playerSpecies.baseStats.def,
          multiplier,
          enemyGmx?.active ? enemyGmx.multiplier : 1,
        );
        const newHp = Math.max(0, playerCreature.currentHp - damage);
        usePlayerStore.getState().updateCreatureHp(partyIndex, newHp);
        log.push(`${enemySpecies.name} 使用了 ${enemyMove.name}，造成 ${damage} 点伤害！`);
      }

      set({ activeTeamSlot: teamSlot, log });
      resolveAfterAction();
    },

    attemptCatch: () => {
      const state = get();
      if (state.phase !== 'catchOpportunity') return;

      const enemySpecies = getSpecies(state.enemyTeam[state.enemyActiveSlot].speciesId);

      set((s) => ({
        log: [...s.log, `你向 ${enemySpecies.name} 投出了精灵球！`],
        phase: 'resolving',
      }));

      setTimeout(() => {
        const success = rollCatchSuccess();

        if (success) {
          const caught: CreatureInstance = { speciesId: enemySpecies.id, currentHp: enemySpecies.baseStats.hp };
          usePlayerStore.getState().setParty([...usePlayerStore.getState().party, caught]);
          set((s) => ({ log: [...s.log, `收服成功！${enemySpecies.name} 加入了队伍！`] }));
          advanceEnemyOrFinish('caught');
          return;
        }

        set((s) => ({ log: [...s.log, `糟糕，${enemySpecies.name} 挣脱了精灵球……`] }));
        advanceEnemyOrFinish('win');
      }, RESOLVE_STEP_DELAY_MS);
    },

    skipCatchOpportunity: () => {
      const state = get();
      if (state.phase !== 'catchOpportunity') return;
      advanceEnemyOrFinish('win');
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
        enemyTeam: [],
        enemyActiveSlot: 0,
        playerTeamIndices: [],
        activeTeamSlot: 0,
        playerGigantamax: {},
        enemyGigantamax: {},
        log: [],
        phase: 'choose',
        outcome: null,
      });
    },
  };
});
