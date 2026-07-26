import type { CreatureInstance } from './creature';

export interface SaveData {
  version: 1;
  mapId: string;
  x: number;
  y: number;
  facing: 'up' | 'down' | 'left' | 'right';
  party: CreatureInstance[];
  flags: Record<string, boolean>;
}
