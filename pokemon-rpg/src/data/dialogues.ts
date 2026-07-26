import type { DialogueScript } from '../types/dialogue';

export const dialogues: Record<string, DialogueScript> = {
  rival_challenge: {
    id: 'rival_challenge',
    lines: [
      { speaker: '劲敌', text: '哟，好久不见！我还以为你会一直躲在家里不出来呢。' },
      { speaker: '劲敌', text: '我最近抓到了一只很厉害的精灵，一直想找个人试试它的实力。' },
      { speaker: '劲敌', text: '既然你出现在这儿，那就没得跑了——就决定是你了！' },
      { speaker: '劲敌', text: '别用那种表情看我，训练家之间用精灵对话才是礼貌！' },
      { speaker: '劲敌', text: '拿出你的精灵吧，让我看看你这段时间到底有没有偷懒！' },
    ],
    onComplete: {
      startBattleSpeciesId: 'tumbleroo',
      onWinSetFlag: 'questDefeatedRival',
    },
  },
};
