import { create } from 'zustand';
import { usePlayerStore } from './usePlayerStore';
import { useBattleStore } from './useBattleStore';

export type GameMode = 'title' | 'overworld' | 'teamSelect' | 'battle' | 'dialogue' | 'menu';

export const MAX_BATTLE_TEAM_SIZE = 3;

export interface BattleContext {
  enemyPool: string[];
  isWild: boolean;
  onWinSetFlag?: string;
  playerTeamIndices?: number[];
  enemyTeamSpeciesIds?: string[];
}

export interface BeginBattleSetupArgs {
  enemyPool: string[];
  isWild: boolean;
  onWinSetFlag?: string;
}

interface CoordinatorState {
  mode: GameMode;
  battleContext: BattleContext | null;

  goToTitle: () => void;
  enterOverworld: () => void;
  beginBattleSetup: (args: BeginBattleSetupArgs) => void;
  confirmBattleTeam: (playerTeamIndices: number[]) => void;
  exitBattle: (result: 'win' | 'lose' | 'flee' | 'caught') => void;
  enterDialogue: () => void;
  exitDialogue: () => void;
  openMenu: () => void;
  closeMenu: () => void;
}

/**
 * coordinator 是唯一负责跨领域（overworld/teamSelect/battle/dialogue/menu）状态切换的地方。
 * useBattleStore / useDialogueStore / useMapStore 之间不直接互相调用，
 * 而是都通过这里的 action 来请求切换 mode。
 */
export const useCoordinator = create<CoordinatorState>((set, get) => ({
  mode: 'title',
  battleContext: null,

  goToTitle: () => set({ mode: 'title', battleContext: null }),

  enterOverworld: () => set({ mode: 'overworld', battleContext: null }),

  beginBattleSetup: ({ enemyPool, isWild, onWinSetFlag }) => {
    set({
      mode: 'teamSelect',
      battleContext: { enemyPool, isWild, onWinSetFlag },
    });
  },

  confirmBattleTeam: (playerTeamIndices) => {
    const ctx = get().battleContext;
    if (!ctx) return;

    const teamSize = Math.min(playerTeamIndices.length, MAX_BATTLE_TEAM_SIZE);
    const trimmedIndices = playerTeamIndices.slice(0, teamSize);
    const enemyTeamSpeciesIds = useBattleStore.getState().sampleEnemyTeam(ctx.enemyPool, teamSize);

    set({
      mode: 'battle',
      battleContext: { ...ctx, playerTeamIndices: trimmedIndices, enemyTeamSpeciesIds },
    });

    useBattleStore.getState().startBattle(trimmedIndices, enemyTeamSpeciesIds);
  },

  exitBattle: (result) => {
    const ctx = get().battleContext;
    if (result === 'win' && ctx?.onWinSetFlag) {
      usePlayerStore.getState().setFlag(ctx.onWinSetFlag, true);
    }
    if (result === 'lose') {
      usePlayerStore.getState().handleBlackout();
    }
    set({ mode: 'overworld', battleContext: null });
  },

  enterDialogue: () => set({ mode: 'dialogue' }),

  exitDialogue: () => set({ mode: 'overworld' }),

  openMenu: () => set({ mode: 'menu' }),

  closeMenu: () => set({ mode: 'overworld' }),
}));
