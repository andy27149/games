import type { DialogueScript } from '../types/dialogue';

export interface AdvanceResult {
  done: boolean;
  nextIndex: number;
}

/**
 * 纯函数：给定当前对话脚本和当前行索引，计算下一行索引与是否已结束。
 * 不依赖任何 store，方便单元测试。
 */
export function advanceLine(script: DialogueScript, currentIndex: number): AdvanceResult {
  const nextIndex = currentIndex + 1;
  return {
    done: nextIndex >= script.lines.length,
    nextIndex,
  };
}
