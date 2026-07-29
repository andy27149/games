import { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useCoordinator, RELEASE_COUNT } from '../store/coordinator';
import { species } from '../data/species';
import { TYPE_LABELS } from '../data/typeLabels';
import { sfx } from '../audio/audioManager';
import type { Species } from '../types/creature';

function getSpecies(speciesId: string): Species | undefined {
  return species.find((s) => s.id === speciesId);
}

export default function ReleaseScreen() {
  const party = usePlayerStore((s) => s.party);
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (index: number) => {
    sfx('select');
    setSelected((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      if (prev.length >= RELEASE_COUNT) {
        return prev;
      }
      return [...prev, index];
    });
  };

  const confirm = () => {
    if (selected.length !== RELEASE_COUNT) return;
    sfx('confirm');
    useCoordinator.getState().confirmRelease(selected);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white p-6 gap-6">
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-2xl font-bold">精灵数量超出上限！</h2>
        <p className="text-slate-400 text-sm">
          请选择 {RELEASE_COUNT} 只精灵放生（已选 {selected.length} 只），放生后将不再属于你，且无法恢复
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl max-h-[60vh] overflow-y-auto">
        {party.map((creature, i) => {
          const sp = getSpecies(creature.speciesId);
          if (!sp) return null;
          const isSelected = selected.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-colors ${
                isSelected
                  ? 'border-red-400 bg-red-900/40'
                  : 'border-slate-700 bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <span className="font-semibold">
                {sp.name}（{TYPE_LABELS[sp.type]}）
              </span>
              <span className="text-sm text-slate-400">
                {creature.currentHp}/{sp.baseStats.hp}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={confirm}
        disabled={selected.length !== RELEASE_COUNT}
        className="py-2 px-8 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 font-semibold"
      >
        确认放生
      </button>
    </div>
  );
}
