import { useEffect, useRef } from 'react';
import type { TileType } from '../types/map';
import { useMapStore } from '../store/useMapStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useCoordinator } from '../store/coordinator';

type Facing = 'up' | 'down' | 'left' | 'right';

const TILE_COLORS: Record<TileType, string> = {
  grass: '#4ade80',
  path: '#d2b48c',
  water: '#3b82f6',
  wall: '#374151',
  tallgrass: '#15803d',
};

const FACING_ANGLE: Record<Facing, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

const VIEWPORT_TILES_X = 14;
const VIEWPORT_TILES_Y = 12;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapDef = useMapStore((s) => s.mapDef);
  const playerX = usePlayerStore((s) => s.x);
  const playerY = usePlayerStore((s) => s.y);
  const playerFacing = usePlayerStore((s) => s.facing);

  // 安全兜底：正常流程下 TitleScreen 会先设置好合法的 mapId，这里只是防御性同步。
  useEffect(() => {
    const currentMapId = usePlayerStore.getState().mapId;
    if (currentMapId && currentMapId !== useMapStore.getState().mapDef.id) {
      useMapStore.getState().loadMap(currentMapId);
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (useCoordinator.getState().mode !== 'overworld') return;
      if (e.repeat) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          useMapStore.getState().move(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          useMapStore.getState().move(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          useMapStore.getState().move(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          useMapStore.getState().move(1, 0);
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          useMapStore.getState().interact();
          break;
        case 'Escape':
        case 'm':
        case 'M':
          e.preventDefault();
          useCoordinator.getState().openMenu();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, tileSize, tiles, npcs } = mapDef;
    const viewportTilesX = Math.min(VIEWPORT_TILES_X, width);
    const viewportTilesY = Math.min(VIEWPORT_TILES_Y, height);
    canvas.width = viewportTilesX * tileSize;
    canvas.height = viewportTilesY * tileSize;

    const cameraX = clamp(playerX - Math.floor(viewportTilesX / 2), 0, Math.max(0, width - viewportTilesX));
    const cameraY = clamp(playerY - Math.floor(viewportTilesY / 2), 0, Math.max(0, height - viewportTilesY));

    for (let y = cameraY; y < cameraY + viewportTilesY; y++) {
      for (let x = cameraX; x < cameraX + viewportTilesX; x++) {
        ctx.fillStyle = TILE_COLORS[tiles[y][x]];
        ctx.fillRect((x - cameraX) * tileSize, (y - cameraY) * tileSize, tileSize, tileSize);
      }
    }

    const npcPad = tileSize * 0.15;
    for (const npc of npcs) {
      if (npc.x < cameraX || npc.x >= cameraX + viewportTilesX || npc.y < cameraY || npc.y >= cameraY + viewportTilesY) {
        continue;
      }
      ctx.fillStyle = npc.color;
      ctx.fillRect(
        (npc.x - cameraX) * tileSize + npcPad,
        (npc.y - cameraY) * tileSize + npcPad,
        tileSize - npcPad * 2,
        tileSize - npcPad * 2,
      );
    }

    // 玩家：一个指向 facing 方向的三角形
    const cx = (playerX - cameraX) * tileSize + tileSize / 2;
    const cy = (playerY - cameraY) * tileSize + tileSize / 2;
    const r = tileSize * 0.35;
    const angle = FACING_ANGLE[playerFacing];
    const spread = (2 * Math.PI) / 3;

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.lineTo(cx + r * Math.cos(angle + spread), cy + r * Math.sin(angle + spread));
    ctx.lineTo(cx + r * Math.cos(angle - spread), cy + r * Math.sin(angle - spread));
    ctx.closePath();
    ctx.fill();
  }, [mapDef, playerX, playerY, playerFacing]);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <canvas ref={canvasRef} className="border-4 border-gray-700" />
    </div>
  );
}

export default MapCanvas;
