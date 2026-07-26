import { useEffect } from 'react';
import { useDialogueStore } from '../store/useDialogueStore';
import { dialogues } from '../data/dialogues';
import { sfx } from '../audio/audioManager';

function advance(): void {
  sfx('select');
  useDialogueStore.getState().advance();
}

export default function DialogueBox() {
  const scriptId = useDialogueStore((s) => s.scriptId);
  const lineIndex = useDialogueStore((s) => s.lineIndex);
  const isActive = useDialogueStore((s) => s.isActive);

  useEffect(() => {
    if (!isActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive]);

  if (!isActive || !scriptId) return null;

  const script = dialogues[scriptId];
  const line = script?.lines[lineIndex];
  if (!line) return null;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 p-6 cursor-pointer"
      onClick={advance}
    >
      <div className="max-w-3xl mx-auto bg-slate-950/95 border-2 border-slate-600 rounded-xl p-5 shadow-2xl">
        {line.speaker && (
          <div className="text-emerald-400 font-bold mb-1">{line.speaker}</div>
        )}
        <div className="text-white text-lg leading-relaxed">{line.text}</div>
        <div className="text-right text-slate-500 text-xs mt-2 animate-pulse">
          点击继续 ▼
        </div>
      </div>
    </div>
  );
}
