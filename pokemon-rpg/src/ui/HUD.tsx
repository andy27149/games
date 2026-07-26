import { usePlayerStore } from '../store/usePlayerStore';
import { species } from '../data/species';
import type { Species } from '../types/creature';

function getSpecies(speciesId: string): Species | undefined {
  return species.find((s) => s.id === speciesId);
}

export default function HUD() {
  const party = usePlayerStore((s) => s.party);

  return (
    <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
      <div className="flex flex-col gap-1.5 bg-slate-950/70 border border-slate-700 rounded-lg p-2 w-44">
        {party.map((creature, i) => {
          const sp = getSpecies(creature.speciesId);
          if (!sp) return null;
          const maxHp = sp.baseStats.hp;
          const pct = maxHp > 0 ? Math.max(0, Math.min(100, (creature.currentHp / maxHp) * 100)) : 0;
          return (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="flex justify-between text-[10px] text-slate-300">
                <span className="truncate">{sp.name}</span>
                <span>{creature.currentHp}/{maxHp}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="self-end bg-slate-950/70 border border-slate-700 rounded-lg px-3 py-1.5 text-[11px] text-slate-400 flex flex-col items-end gap-0.5">
        <span>方向键 / WASD 移动</span>
        <span>空格键与NPC互动</span>
        <span>按 M 打开菜单</span>
      </div>
    </div>
  );
}
