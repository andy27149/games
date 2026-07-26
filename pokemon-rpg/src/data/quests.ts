import type { Quest } from '../types/dialogue';

export const quests: Quest[] = [
  {
    id: 'defeat_rival',
    title: '打倒劲敌',
    description: '你的劲敌正在附近等着挑战你，去击败他的精灵，证明你的实力！',
    completeFlag: 'questDefeatedRival',
  },
];
