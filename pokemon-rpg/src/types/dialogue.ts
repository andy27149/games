export interface DialogueLine {
  speaker?: string;
  text: string;
}

export interface DialogueScript {
  id: string;
  lines: DialogueLine[];
  onComplete?: {
    setFlag?: string;
    startBattleSpeciesIds?: string[];
    onWinSetFlag?: string;
  };
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  completeFlag: string;
}
