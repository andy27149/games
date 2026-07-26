import { create } from 'zustand';
import type { CreatureInstance } from '../types/creature';
import type { SaveData } from '../types/save';
import { species } from '../data/species';
import { maps } from '../data/maps';

const SAVE_KEY = 'pokerpg-save';

type Facing = 'up' | 'down' | 'left' | 'right';

interface PlayerState {
  mapId: string;
  x: number;
  y: number;
  facing: Facing;
  party: CreatureInstance[];
  flags: Record<string, boolean>;

  /** 开新游戏。party 由调用方（拿得到 species 数据的一侧）按初始精灵组装好传入。 */
  initNewGame: (mapId: string, spawn: { x: number; y: number }, party: CreatureInstance[]) => void;
  setPosition: (x: number, y: number, facing: Facing) => void;
  setMapId: (mapId: string) => void;
  setFlag: (flag: string, value: boolean) => void;
  setParty: (party: CreatureInstance[]) => void;
  updateCreatureHp: (index: number, currentHp: number) => void;
  /** 队伍团灭后送回出生点并回满血，仿照正统 Pokémon 的黑屏机制。 */
  handleBlackout: () => void;

  hasSave: () => boolean;
  save: () => void;
  loadSave: () => boolean;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  mapId: '',
  x: 0,
  y: 0,
  facing: 'down',
  party: [],
  flags: {},

  initNewGame: (mapId, spawn, party) =>
    set({
      mapId,
      x: spawn.x,
      y: spawn.y,
      facing: 'down',
      party,
      flags: {},
    }),

  setPosition: (x, y, facing) => set({ x, y, facing }),

  setMapId: (mapId) => set({ mapId }),

  setFlag: (flag, value) =>
    set((state) => ({ flags: { ...state.flags, [flag]: value } })),

  setParty: (party) => set({ party }),

  updateCreatureHp: (index, currentHp) =>
    set((state) => ({
      party: state.party.map((c, i) => (i === index ? { ...c, currentHp } : c)),
    })),

  handleBlackout: () => {
    const state = get();
    const healedParty = state.party.map((c) => {
      const sp = species.find((s) => s.id === c.speciesId);
      return sp ? { ...c, currentHp: sp.baseStats.hp } : c;
    });
    const spawn = maps[state.mapId]?.playerSpawn ?? { x: state.x, y: state.y };
    set({ party: healedParty, x: spawn.x, y: spawn.y, facing: 'down' });
  },

  hasSave: () => localStorage.getItem(SAVE_KEY) !== null,

  save: () => {
    const state = get();
    const data: SaveData = {
      version: 1,
      mapId: state.mapId,
      x: state.x,
      y: state.y,
      facing: state.facing,
      party: state.party,
      flags: state.flags,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  },

  loadSave: () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw) as SaveData;
      if (data.version !== 1) return false;
      set({
        mapId: data.mapId,
        x: data.x,
        y: data.y,
        facing: data.facing,
        party: data.party,
        flags: data.flags,
      });
      return true;
    } catch {
      return false;
    }
  },
}));
