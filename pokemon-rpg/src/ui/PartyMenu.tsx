import { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useCoordinator } from '../store/coordinator';
import { species } from '../data/species';
import { quests } from '../data/quests';
import { TYPE_LABELS } from '../data/typeLabels';
import { sfx } from '../audio/audioManager';
import type { Species } from '../types/creature';

function getSpecies(speciesId: string): Species | undefined {
  return species.find((s) => s.id === speciesId);
}

function shapeClass(shape: Species['shape']): string {
  if (shape === 'circle') return 'rounded-full';
  if (shape === 'square') return 'rounded-md';
  return 'rounded-sm';
}

export default function PartyMenu() {
  const party = usePlayerStore((s) => s.party);
  const flags = usePlayerStore((s) => s.flags);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    usePlayerStore.getState().save();
    sfx('save');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleClose = () => {
    sfx('select');
    useCoordinator.getState().closeMenu();
  };

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-full overflow-y-auto p-6 flex flex-col gap-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white">菜单</h2>

        <section>
          <h3 className="text-slate-400 text-sm font-semibold mb-2 uppercase tracking-wide">
            我的精灵
          </h3>
          <div className="flex flex-col gap-2">
            {party.map((creature, i) => {
              const sp = getSpecies(creature.speciesId);
              if (!sp) return null;
              const maxHp = sp.baseStats.hp;
              const pct = maxHp > 0 ? Math.max(0, Math.min(100, (creature.currentHp / maxHp) * 100)) : 0;
              return (
                <div key={i} className="flex items-center gap-3 bg-slate-800 rounded-lg p-3">
                  <div
                    className={`w-10 h-10 shrink-0 ${shapeClass(sp.shape)}`}
                    style={{ backgroundColor: sp.color }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-white">{sp.name}（{TYPE_LABELS[sp.type]}）</span>
                      <span className="text-slate-400">{creature.currentHp}/{maxHp}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full ${pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {party.length === 0 && (
              <div className="text-slate-500 text-sm">你的队伍中还没有精灵。</div>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-slate-400 text-sm font-semibold mb-2 uppercase tracking-wide">
            任务
          </h3>
          <div className="flex flex-col gap-2">
            {quests.map((quest) => {
              const complete = !!flags[quest.completeFlag];
              return (
                <div key={quest.id} className="bg-slate-800 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">{quest.title}</span>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        complete ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {complete ? '已完成' : '进行中'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{quest.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-700">
          {saved && <span className="text-emerald-400 text-sm self-center mr-auto">已存档！</span>}
          <button
            type="button"
            onClick={handleSave}
            className="py-2 px-5 rounded-md bg-emerald-600 hover:bg-emerald-500 font-semibold"
          >
            存档
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="py-2 px-5 rounded-md bg-slate-700 hover:bg-slate-600 font-semibold"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
