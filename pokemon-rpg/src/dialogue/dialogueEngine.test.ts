import { describe, it, expect } from 'vitest';
import type { DialogueScript } from '../types/dialogue';
import { advanceLine } from './dialogueEngine';

const script: DialogueScript = {
  id: 'test_script',
  lines: [
    { speaker: 'A', text: 'Line one.' },
    { speaker: 'A', text: 'Line two.' },
    { speaker: 'A', text: 'Line three.' },
  ],
};

describe('advanceLine', () => {
  it('advances through a multi-line script line by line', () => {
    const first = advanceLine(script, 0);
    expect(first).toEqual({ done: false, nextIndex: 1 });

    const second = advanceLine(script, first.nextIndex);
    expect(second).toEqual({ done: false, nextIndex: 2 });
  });

  it('reports done: true on the final advance', () => {
    const result = advanceLine(script, 2);
    expect(result).toEqual({ done: true, nextIndex: 3 });
  });

  it('reports done: true immediately for a single-line script', () => {
    const singleLine: DialogueScript = {
      id: 'single',
      lines: [{ text: 'Only line.' }],
    };
    const result = advanceLine(singleLine, 0);
    expect(result).toEqual({ done: true, nextIndex: 1 });
  });
});
