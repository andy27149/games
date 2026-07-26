import { create } from 'zustand';
import { advanceLine } from '../dialogue/dialogueEngine';
import { dialogues } from '../data/dialogues';
import { useCoordinator } from './coordinator';
import { usePlayerStore } from './usePlayerStore';
import { useBattleStore } from './useBattleStore';

interface DialogueState {
  scriptId: string | null;
  lineIndex: number;
  isActive: boolean;

  start: (scriptId: string) => void;
  advance: () => void;
}

export const useDialogueStore = create<DialogueState>((set, get) => ({
  scriptId: null,
  lineIndex: 0,
  isActive: false,

  start: (scriptId) => {
    set({ scriptId, lineIndex: 0, isActive: true });
  },

  advance: () => {
    const { scriptId, lineIndex } = get();
    if (!scriptId) return;
    const script = dialogues[scriptId];
    if (!script) return;

    const { done, nextIndex } = advanceLine(script, lineIndex);

    if (!done) {
      set({ lineIndex: nextIndex });
      return;
    }

    const onComplete = script.onComplete;
    if (onComplete?.setFlag) {
      usePlayerStore.getState().setFlag(onComplete.setFlag, true);
    }
    if (onComplete?.startBattleSpeciesId) {
      useCoordinator.getState().enterBattle({
        speciesId: onComplete.startBattleSpeciesId,
        onWinSetFlag: onComplete.onWinSetFlag,
      });
      useBattleStore.getState().startBattle(onComplete.startBattleSpeciesId);
    } else {
      useCoordinator.getState().exitDialogue();
    }

    set({ scriptId: null, lineIndex: 0, isActive: false });
  },
}));
