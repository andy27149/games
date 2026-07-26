import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useBattleStore } from '../store/useBattleStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useCoordinator } from '../store/coordinator';
import { species } from '../data/species';
import { moves } from '../data/moves';
import type { Species } from '../types/creature';
import { sfx } from '../audio/audioManager';

function getSpecies(speciesId: string): Species | undefined {
  return species.find((s) => s.id === speciesId);
}

function getMoveName(moveId: string): string {
  return moves.find((m) => m.id === moveId)?.name ?? moveId;
}

function CreatureShape({ color, shape, size = 72 }: { color: string; shape: Species['shape']; size?: number }) {
  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundColor: color,
  };

  if (shape === 'circle') {
    style.borderRadius = '9999px';
  } else if (shape === 'square') {
    style.borderRadius = '8px';
  } else if (shape === 'diamond') {
    style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
  } else if (shape === 'triangle') {
    style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
  }

  return <div style={style} className="drop-shadow-lg" />;
}

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const color = pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
      <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }} />
      <div className="sr-only">{current}/{max}</div>
    </div>
  );
}

export default function BattleScreen() {
  const enemySpeciesId = useBattleStore((s) => s.enemySpeciesId);
  const enemyHp = useBattleStore((s) => s.enemyHp);
  const enemyMaxHp = useBattleStore((s) => s.enemyMaxHp);
  const activeIndex = useBattleStore((s) => s.activeIndex);
  const log = useBattleStore((s) => s.log);
  const phase = useBattleStore((s) => s.phase);
  const outcome = useBattleStore((s) => s.outcome);

  const party = usePlayerStore((s) => s.party);
  const isWild = useCoordinator((s) => s.battleContext?.isWild ?? false);

  const [switchPanelOpen, setSwitchPanelOpen] = useState(false);

  const enemySpecies = getSpecies(enemySpeciesId);
  const activeCreature = party[activeIndex];
  const activeSpecies = activeCreature ? getSpecies(activeCreature.speciesId) : undefined;
  const activeMaxHp = activeSpecies?.baseStats.hp ?? 1;

  const prevLogLen = useRef(log.length);
  const prevEnemyHp = useRef(enemyHp);
  const prevActiveHp = useRef(activeCreature?.currentHp ?? 0);
  const endedSfxPlayed = useRef(false);

  useEffect(() => {
    if (log.length > prevLogLen.current) {
      sfx('hit');
    }
    prevLogLen.current = log.length;
  }, [log.length]);

  useEffect(() => {
    if (prevEnemyHp.current > 0 && enemyHp <= 0) {
      sfx('faint');
    }
    prevEnemyHp.current = enemyHp;
  }, [enemyHp]);

  useEffect(() => {
    const hp = activeCreature?.currentHp ?? 0;
    if (prevActiveHp.current > 0 && hp <= 0) {
      sfx('faint');
    }
    prevActiveHp.current = hp;
  }, [activeCreature?.currentHp]);

  useEffect(() => {
    if (phase === 'ended' && outcome && !endedSfxPlayed.current) {
      endedSfxPlayed.current = true;
      if (outcome === 'win' || outcome === 'caught') sfx('win');
      else if (outcome === 'lose') sfx('lose');
      else if (outcome === 'flee') sfx('flee');
    }
    if (phase !== 'ended') {
      endedSfxPlayed.current = false;
    }
  }, [phase, outcome]);

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  if (!enemySpecies || !activeSpecies || !activeCreature) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-400">
        战斗准备中…
      </div>
    );
  }

  const livingReserves = party
    .map((c, i) => ({ c, i }))
    .filter(({ c, i }) => i !== activeIndex && c.currentHp > 0);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-sky-950 via-slate-900 to-slate-950 text-white p-4 gap-4">
      {/* Enemy side */}
      <div className="flex items-center justify-between px-6">
        <div className="w-64">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">{enemySpecies.name}</span>
            <span className="text-slate-400">{enemyHp}/{enemyMaxHp}</span>
          </div>
          <HpBar current={enemyHp} max={enemyMaxHp} />
        </div>
        <CreatureShape color={enemySpecies.color} shape={enemySpecies.shape} />
      </div>

      {/* Battle log */}
      <div
        ref={logRef}
        className="flex-1 min-h-0 overflow-y-auto bg-black/40 border border-slate-700 rounded-lg p-3 text-sm space-y-1"
      >
        {log.map((line, i) => (
          <div key={i} className="text-slate-200">{line}</div>
        ))}
      </div>

      {/* Player side */}
      <div className="flex items-center justify-between px-6">
        <CreatureShape color={activeSpecies.color} shape={activeSpecies.shape} />
        <div className="w-64">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">{activeSpecies.name}</span>
            <span className="text-slate-400">{activeCreature.currentHp}/{activeMaxHp}</span>
          </div>
          <HpBar current={activeCreature.currentHp} max={activeMaxHp} />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-3 min-h-[140px]">
        {phase === 'choose' && !switchPanelOpen && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              {activeSpecies.moveIds.map((moveId) => (
                <button
                  key={moveId}
                  type="button"
                  disabled={phase !== 'choose'}
                  onClick={() => {
                    sfx('select');
                    useBattleStore.getState().chooseMove(moveId);
                  }}
                  className="py-2 px-3 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:hover:bg-slate-700 font-medium"
                >
                  {getMoveName(moveId)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  sfx('select');
                  setSwitchPanelOpen(true);
                }}
                disabled={livingReserves.length === 0}
                className="flex-1 py-2 rounded-md bg-sky-700 hover:bg-sky-600 disabled:opacity-40 font-medium"
              >
                切换
              </button>
              {isWild && (
                <button
                  type="button"
                  onClick={() => {
                    sfx('select');
                    useBattleStore.getState().attemptCatch();
                  }}
                  className="flex-1 py-2 rounded-md bg-purple-700 hover:bg-purple-600 font-medium"
                >
                  收服
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  sfx('select');
                  useBattleStore.getState().flee();
                }}
                className="flex-1 py-2 rounded-md bg-red-700 hover:bg-red-600 font-medium"
              >
                逃跑
              </button>
            </div>
          </div>
        )}

        {phase === 'resolving' && (
          <div className="flex flex-col items-center justify-center h-full py-4 gap-2 text-slate-400">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" />
            </div>
            <div className="text-sm">回合结算中…</div>
          </div>
        )}

        {phase === 'choose' && switchPanelOpen && (
          <div className="flex flex-col gap-2">
            <div className="text-sm text-slate-400">选择要换上场的精灵：</div>
            <div className="grid grid-cols-2 gap-2">
              {livingReserves.map(({ c, i }) => {
                const sp = getSpecies(c.speciesId);
                if (!sp) return null;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      sfx('select');
                      useBattleStore.getState().switchActive(i);
                      setSwitchPanelOpen(false);
                    }}
                    className="py-2 px-3 rounded-md bg-slate-700 hover:bg-slate-600 font-medium text-left"
                  >
                    {sp.name} ({c.currentHp}/{sp.baseStats.hp})
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                sfx('select');
                setSwitchPanelOpen(false);
              }}
              className="py-1 text-sm text-slate-400 hover:text-slate-200"
            >
              取消
            </button>
          </div>
        )}

        {phase === 'forceSwitch' && (
          <div className="flex flex-col gap-2">
            <div className="text-sm text-yellow-400">{activeSpecies.name} 倒下了！请选择下一只精灵：</div>
            <div className="grid grid-cols-2 gap-2">
              {party.map((c, i) => {
                if (c.currentHp <= 0) return null;
                const sp = getSpecies(c.speciesId);
                if (!sp) return null;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      sfx('select');
                      useBattleStore.getState().switchActive(i);
                    }}
                    className="py-2 px-3 rounded-md bg-slate-700 hover:bg-slate-600 font-medium text-left"
                  >
                    {sp.name} ({c.currentHp}/{sp.baseStats.hp})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {phase === 'ended' && (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="text-2xl font-bold">
              {outcome === 'win' && <span className="text-emerald-400">胜利！</span>}
              {outcome === 'lose' && <span className="text-red-400">败北……</span>}
              {outcome === 'flee' && <span className="text-slate-300">逃跑成功</span>}
              {outcome === 'caught' && <span className="text-purple-400">收服成功！</span>}
            </div>
            {outcome === 'lose' && (
              <div className="text-sm text-slate-400 text-center">
                你被送回了安全的地方，精灵们已经完全恢复
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                sfx('select');
                useBattleStore.getState().acknowledgeEnd();
              }}
              className="py-2 px-8 rounded-md bg-emerald-600 hover:bg-emerald-500 font-semibold"
            >
              继续
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
