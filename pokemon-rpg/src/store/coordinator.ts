import { create } from 'zustand';
import { usePlayerStore } from './usePlayerStore';

export type GameMode = 'title' | 'overworld' | 'battle' | 'dialogue' | 'menu';

export interface BattleContext {
  speciesId: string;
  onWinSetFlag?: string;
  isWild?: boolean;
}

interface CoordinatorState {
  mode: GameMode;
  battleContext: BattleContext | null;

  goToTitle: () => void;
  enterOverworld: () => void;
  enterBattle: (ctx: BattleContext) => void;
  exitBattle: (result: 'win' | 'lose' | 'flee' | 'caught') => void;
  enterDialogue: () => void;
  exitDialogue: () => void;
  openMenu: () => void;
  closeMenu: () => void;
}

/**
 * coordinator 是唯一负责跨领域（overworld/battle/dialogue/menu）状态切换的地方。
 * useBattleStore / useDialogueStore / useMapStore 之间不直接互相调用，
 * 而是都通过这里的 action 来请求切换 mode。
 */
export const useCoordinator = create<CoordinatorState>((set, get) => ({
  mode: 'title',
  battleContext: null,

  goToTitle: () => set({ mode: 'title', battleContext: null }),

  enterOverworld: () => set({ mode: 'overworld', battleContext: null }),

  enterBattle: (ctx) => set({ mode: 'battle', battleContext: ctx }),

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
