# Pokémon 风格网页 RPG — 设计文档

日期：2026-07-26
范围：小型垂直切片（vertical slice）— 走通"移动 → 遭遇 → 回合制战斗 → 剧情/任务 → 存档"完整闭环。

## 技术栈

- React + TypeScript + Vite
- Tailwind CSS（样式）
- Framer Motion（动画）
- Zustand（状态管理）
- localStorage（存档）
- Web Audio API（合成音效，无外部音频素材，无 BGM）
- 美术：纯代码绘制占位图形（Canvas 色块/几何形状），不依赖外部图片素材

## 协作模式

真正的多 Agent 并行开发：架构师（本文档）先完成设计与类型定义，随后 4 个 Agent 分别扮演 Teammate B/C/D/E 并行开发，最后由架构师整合、联调、排查冲突。

## 明确砍掉的范围（v1 不做，可后续扩展）

- 等级/经验值系统 — 生物属性由 Species 固定提供，无成长
- 捕捉野生精灵机制 — 战斗只有 胜/负/逃跑，没有"收服"
- BGM 循环背景音乐 — 只做合成音效
- 状态异常（中毒/麻痹等）、暴击、命中率之外的战斗高级机制
- 多地图切换 — 只有 1 张地图（1 个场景）

## 项目结构与文件归属

```
src/
  types/              ← 架构师所有（交接后冻结，其他人只读不改）
    creature.ts        Species, Move, CreatureInstance, Stats, ElementType
    map.ts              Tile, MapDef, NpcPlacement
    dialogue.ts         DialogueScript, DialogueLine, Quest
    save.ts             SaveData
  store/
    coordinator.ts     ← 架构师。mode: title|overworld|battle|dialogue|menu + 状态切换函数
    usePlayerStore.ts  ← 架构师（骨架）— party、position、flags、save/load
    useBattleStore.ts  ← Teammate B
    useMapStore.ts     ← Teammate D
    useDialogueStore.ts ← Teammate C
  data/
    typeChart.ts       ← 架构师（属性克制表内容）
    moves.ts           ← Teammate B（技能内容数据）
    species.ts         ← Teammate B（精灵属性内容数据）
    maps.ts            ← Teammate D（地图格子数据、出生点、遭遇区域）
    npcs.ts            ← Teammate C
    dialogues.ts       ← Teammate C
    quests.ts          ← Teammate C
  battle/
    battleLogic.ts     ← Teammate B（纯函数：伤害计算、出手顺序、敌方AI选招）
  dialogue/
    dialogueEngine.ts  ← Teammate C（对话脚本推进逻辑）
  map/
    MapCanvas.tsx       ← Teammate D（canvas 渲染循环、按键输入、碰撞、摄像机）
  ui/
    BattleScreen.tsx    ← Teammate E
    DialogueBox.tsx     ← Teammate E
    PartyMenu.tsx       ← Teammate E
    HUD.tsx             ← Teammate E
    TitleScreen.tsx     ← Teammate E
  audio/
    audioManager.ts    ← Teammate E（Web Audio 合成音效：sfx('select'|'hit'|'faint'|'win'...)）
  App.tsx              ← 架构师（根据 coordinator.mode 挂载对应画面）
  main.tsx, index.css  ← 架构师（Vite/Tailwind 脚手架）
```

**归属原则**：每位队友拥有一组互不重叠的文件（自己的 store + 自己的 data + 自己的逻辑/组件）。唯一"只读共享"的文件是 `types/*` 与 `data/typeChart.ts`，由架构师在交接前冻结，确保 4 个 Agent 可以并行工作而不产生文件冲突。

**战斗/对话的 UI 拆分**：B 和 C 只负责*逻辑与状态*（不写 JSX）；E 负责*所有*展示型组件，调用 B/C/D 暴露的 store actions。这样 E 一开始就能对着架构师定义好的 store 类型开工，不必等 B/C 把内部逻辑写完。

## 核心数据结构

```typescript
// types/creature.ts
type ElementType = 'normal' | 'fire' | 'water' | 'grass';

interface Stats { hp: number; atk: number; def: number; spd: number; }

interface Species {
  id: string;
  name: string;
  type: ElementType;
  baseStats: Stats;
  moveIds: string[];       // 最多4个，固定技能组，v1无升级
  color: string;           // 占位图形填色
  shape: 'circle' | 'square' | 'triangle' | 'diamond';
}

interface Move {
  id: string;
  name: string;
  type: ElementType;
  power: number;           // 状态类技能为0（v1暂不使用，字段先留出）
  accuracy: number;        // 0-100
  category: 'physical' | 'special';
}

interface CreatureInstance {
  speciesId: string;
  currentHp: number;       // maxHp = species.baseStats.hp，无成长
}

// types/map.ts
type TileType = 'grass' | 'path' | 'water' | 'wall' | 'tallgrass';
interface MapDef {
  id: string; width: number; height: number; tileSize: number;
  tiles: TileType[][];               // [y][x]
  npcs: NpcPlacement[];
  encounterSpeciesIds: string[];     // 该地图野生精灵池
  encounterRate: number;             // 每步在tallgrass触发遭遇的概率 0-1
  playerSpawn: { x: number; y: number };
}
interface NpcPlacement { id: string; x: number; y: number; dialogueId: string; color: string; }

// types/dialogue.ts
interface DialogueLine { speaker?: string; text: string; }
interface DialogueScript {
  id: string;
  lines: DialogueLine[];
  onComplete?: { setFlag?: string; startBattleSpeciesId?: string; onWinSetFlag?: string };
}
interface Quest { id: string; title: string; description: string; completeFlag: string; }

// types/save.ts
interface SaveData {
  version: 1;
  mapId: string;
  x: number; y: number; facing: 'up'|'down'|'left'|'right';
  party: CreatureInstance[];
  flags: Record<string, boolean>;
}
```

- 战斗中的临时状态（当前出战精灵、回合日志、阶段）**不进入存档**，只存在于 `mode === 'battle'` 期间。
- `flags: Record<string, boolean>` 是唯一的剧情进度机制，v1 只有一个任务，不需要额外的任务状态机。

## 游戏状态机

`GameMode = 'title' | 'overworld' | 'battle' | 'dialogue' | 'menu'`

转换关系：
- `title` → `overworld`（新游戏/继续）
- `overworld` → `battle`（踩到 tallgrass 触发遭遇）
- `overworld` → `dialogue`（与NPC互动）
- `overworld` → `menu`（打开暂停/队伍菜单）
- `battle` → `overworld`（胜利/失败/逃跑后）
- `dialogue` → `overworld` 或 `dialogue` → `battle`（对话触发剧情战斗）
- `menu` → `overworld`（关闭菜单）

`coordinator.ts` 是唯一负责跨领域状态切换的地方，其余 store 之间不直接互相调用。

## 子系统流程

**战斗流程**
1. 玩家踩到 `tallgrass` 格子 → `useMapStore` 按 `encounterRate`(20%) 掷骰 → 命中则从地图 `encounterSpeciesIds` 中随机选一个野生精灵 → 调用 `coordinator.enterBattle(speciesId)`。
2. 回合循环：双方选择技能（玩家通过UI选择，敌方从其技能组随机选择）；按 `spd` 属性决定出手顺序（高者先手）；伤害 = `max(1, floor(move.power * atk/def * 属性克制系数))`；命中判定 `Math.random() < move.accuracy/100`。
3. 玩家可选择 **切换精灵**（消耗本回合）或 **逃跑**（v1中必定成功）。若出战精灵倒下且队伍中还有其他精灵，强制弹出切换提示（不消耗回合）；若全队倒下则战斗失败。
4. 胜利/失败/逃跑后 → `coordinator` 将 `mode` 切回 `overworld`。由对话触发的战斗可携带可选的 `onWinSetFlag`，胜利后设置对应任务完成标记。

**属性克制表**（4种属性：normal, fire, water, grass）— 火克草、水克火、草克水（2倍/0.5倍），normal 对任何属性都是中性。

**对话/任务流程**
1. 与NPC互动 → `useDialogueStore.start(scriptId)`，`mode` 切为 `dialogue`。
2. 逐行推进对话；最后一行触发 `onComplete`，可设置 flag 和/或直接开始一场战斗（`startBattleSpeciesId`）。
3. 本切片唯一任务：NPC 向玩家发起挑战战斗，获胜后设置 `questDefeatedRival: true`。

**存档/读档**
- 仅在暂停菜单中可存档：将 `{mapId, x, y, facing, party, flags}` 序列化写入 `localStorage["pokerpg-save"]`。
- 标题画面检测到已有存档则显示"继续游戏"，否则只显示"新游戏"（固定2只初始精灵，出生在地图出生点）。

## 垂直切片内容量

- 5 个精灵种类，8 个技能，1 张地图（1个场景，含一片 tallgrass 区域）
- 1 个 NPC，含 1 个对话脚本 + 1 个任务 + 1 场剧情战斗
- 野生遭遇从 5 种精灵中的 3 种里随机产生
- 玩家初始队伍为另外 2 种精灵（用于演示战斗中切换精灵的逻辑）

## 测试策略

- `battleLogic.ts`（伤害计算、属性克制、出手顺序）与 `dialogueEngine.ts`（对话推进）为纯函数，使用 Vitest 编写单元测试。
- 地图渲染/Canvas/UI 通过手动浏览器验证黄金路径完成：移动 → 触发遭遇 → 回合制战斗 → 获胜 → 与NPC对话 → 剧情战斗 → 存档 → 刷新读档确认。

## 交付验收标准（Definition of Done）

1. 从标题画面开始新游戏，能在地图上用方向键移动，碰撞正确（撞墙/水无法通过）。
2. 走入 tallgrass 区域有概率触发野生遭遇战斗，战斗界面显示双方HP、技能选择、战斗日志。
3. 战斗中可选择技能攻击、切换精灵、逃跑；伤害计算体现属性克制；一方精灵全部倒下后战斗正确结束并返回地图。
4. 与NPC对话可正常显示对话框逐行推进，对话结束触发剧情战斗，获胜后任务标记为完成。
5. 打开菜单可查看队伍HP、执行存档；刷新页面后读档能恢复到存档时的地图位置、队伍状态与任务进度。
6. 关键操作（选中菜单项、命中、精灵倒下、胜利）有对应的合成音效反馈。
