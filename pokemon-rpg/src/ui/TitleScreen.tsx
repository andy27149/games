import { usePlayerStore } from '../store/usePlayerStore';
import { useCoordinator } from '../store/coordinator';
import { species } from '../data/species';
import { maps } from '../data/maps';
import { sfx } from '../audio/audioManager';

function getStartingHp(speciesId: string): number {
  const found = species.find((s) => s.id === speciesId);
  return found ? found.baseStats.hp : 1;
}

function startNewGame(): void {
  usePlayerStore.getState().initNewGame(
    maps.route1.id,
    maps.route1.playerSpawn,
    [
      { speciesId: 'pyrocub', currentHp: getStartingHp('pyrocub') },
      { speciesId: 'aquabub', currentHp: getStartingHp('aquabub') },
      { speciesId: 'tumbleroo', currentHp: getStartingHp('tumbleroo') },
    ],
  );
  useCoordinator.getState().enterOverworld();
}

function continueGame(): void {
  usePlayerStore.getState().loadSave();
  useCoordinator.getState().enterOverworld();
}

export default function TitleScreen() {
  const hasSave = usePlayerStore((s) => s.hasSave());

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 gap-10">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-5xl font-extrabold tracking-wide text-emerald-300 drop-shadow-[0_2px_10px_rgba(16,185,129,0.5)]">
          宝可梦明耀之星
        </h1>
        <p className="text-slate-400 text-sm tracking-widest uppercase">
          Pocket Creature Adventure
        </p>
      </div>

      <div className="flex flex-col gap-4 w-72">
        {hasSave && (
          <button
            type="button"
            onMouseEnter={() => sfx('select')}
            onFocus={() => sfx('select')}
            onClick={() => {
              sfx('confirm');
              continueGame();
            }}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-lg shadow-lg shadow-emerald-900/50 transition-colors flex flex-col items-center"
          >
            <span>继续游戏</span>
            <span className="text-xs font-normal text-emerald-100/80">从上次存档处继续</span>
          </button>
        )}

        <button
          type="button"
          onMouseEnter={() => sfx('select')}
          onFocus={() => sfx('select')}
          onClick={() => {
            sfx('confirm');
            startNewGame();
          }}
          className="w-full py-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-lg shadow-lg shadow-orange-900/50 transition-colors flex flex-col items-center"
        >
          <span>新游戏</span>
          <span className="text-xs font-normal text-orange-100/80">
            {hasSave ? '从头开始，已有存档将被覆盖' : '开始你的第一次冒险'}
          </span>
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-700 rounded-lg px-5 py-3 text-slate-400 text-xs flex flex-col gap-1 items-center">
        <div className="text-slate-300 font-semibold mb-1">操作说明</div>
        <div>方向键 / WASD 移动</div>
        <div>空格键 / Enter 与NPC互动、推进对话</div>
        <div>M 或 Esc 打开菜单</div>
      </div>
    </div>
  );
}
