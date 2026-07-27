import { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useCoordinator, MAX_BATTLE_TEAM_SIZE } from '../store/coordinator';
import { species } from '../data/species';
import { TYPE_LABELS } from '../data/typeLabels';
import { sfx } from '../audio/audioManager';
import type { Species } from '../types/creature';

function getSpecies(speciesId: string): Species | undefined {
  return species.find((s) => s.id === speciesId);
}

export default function TeamSelectScreen() {
  const party = usePlayerStore((s) => s.party);
  const isWild = useCoordinator((s) => s.battleContext?.isWild ?? false);

  const livingIndices = party
    .map((c, i) => i)
    .filter((i) => party[i].currentHp > 0);

  const [selected, setSelected] = useState<number[]>(() => livingIndices.slice(0, 1));

  const toggle = (index: number) => {
    sfx('select');
    setSelected((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      if (prev.length >= MAX_BATTLE_TEAM_SIZE) {
        return prev;
      }
      return [...prev, index];
    });
  };

  const confirm = () => {
    if (selected.length === 0) return;
    sfx('confirm');
    useCoordinator.getState().confirmBattleTeam(selected);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white p-6 gap-6">
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-2xl font-bold">
          {isWild ? '野生精灵出现了！' : '训练家发起了挑战！'}
        </h2>
        <p className="text-slate-400 text-sm">
          选择 1~{MAX_BATTLE_TEAM_SIZE} 只精灵出战（已选 {selected.length} 只）
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl">
        {livingIndices.map((i) => {
          const creature = party[i];
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
                  ? 'border-emerald-400 bg-emerald-900/40'
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
        disabled={selected.length === 0}
        className="py-2 px-8 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 font-semibold"
      >
        确认出战
      </button>
    </div>
  );
}
