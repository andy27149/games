import { create } from 'zustand';
import type { MapDef } from '../types/map';
import { maps } from '../data/maps';
import { usePlayerStore } from '../store/usePlayerStore';
import { useCoordinator } from '../store/coordinator';
import { useDialogueStore } from '../store/useDialogueStore';

type Facing = 'up' | 'down' | 'left' | 'right';

interface MapState {
  mapDef: MapDef;
  loadMap: (mapId: string) => void;
  move: (dx: -1 | 0 | 1, dy: -1 | 0 | 1) => void;
  interact: () => void;
}

function facingFromDelta(dx: number, dy: number, fallback: Facing): Facing {
  if (dx < 0) return 'left';
  if (dx > 0) return 'right';
  if (dy < 0) return 'up';
  if (dy > 0) return 'down';
  return fallback;
}

function isBlocked(mapDef: MapDef, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= mapDef.width || y >= mapDef.height) return true;
  const tile = mapDef.tiles[y][x];
  if (tile === 'wall' || tile === 'water') return true;
  return mapDef.npcs.some((npc) => npc.x === x && npc.y === y);
}

export const useMapStore = create<MapState>((set, get) => ({
  mapDef: maps.route1,

  loadMap: (mapId) => {
    set({ mapDef: maps[mapId] });
    usePlayerStore.getState().setMapId(mapId);
  },

  move: (dx, dy) => {
    const { mapDef } = get();
    const { x, y, facing } = usePlayerStore.getState();
    const newFacing = facingFromDelta(dx, dy, facing);
    const targetX = x + dx;
    const targetY = y + dy;

    if (isBlocked(mapDef, targetX, targetY)) {
      usePlayerStore.getState().setPosition(x, y, newFacing);
      return;
    }

    usePlayerStore.getState().setPosition(targetX, targetY, newFacing);

    const allFainted = usePlayerStore.getState().party.every((c) => c.currentHp <= 0);
    if (
      !allFainted &&
      mapDef.tiles[targetY][targetX] === 'tallgrass' &&
      Math.random() < mapDef.encounterRate
    ) {
      useCoordinator.getState().beginBattleSetup({ enemyPool: mapDef.encounterSpeciesIds, isWild: true });
    }
  },

  interact: () => {
    const { mapDef } = get();
    const { x, y, facing } = usePlayerStore.getState();
    let faceX = x;
    let faceY = y;
    if (facing === 'up') faceY -= 1;
    else if (facing === 'down') faceY += 1;
    else if (facing === 'left') faceX -= 1;
    else faceX += 1;

    const npc = mapDef.npcs.find((n) => n.x === faceX && n.y === faceY);
    if (npc) {
      useDialogueStore.getState().start(npc.dialogueId);
      useCoordinator.getState().enterDialogue();
    }
  },
}));
