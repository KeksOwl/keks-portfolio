/** Desktop board; phones use the smaller size so cells stay readable. */
export const SIZE_DESKTOP = 12;
export const SIZE_MOBILE = 8;

export const START_LENGTH = 3;
export const MOBILE_MQ = "(max-width: 767px)";

export type Dir = "up" | "down" | "left" | "right";
export type Hero = "owl" | "cat" | "keks";
export type Difficulty = "easy" | "normal" | "hard";

/** Base tick / floor / per-food speed-up. Higher ms = slower. */
const TICK: Record<Difficulty, { base: number; floor: number; ramp: number }> = {
  easy: { base: 320, floor: 175, ramp: 2.5 },
  normal: { base: 220, floor: 100, ramp: 4 },
  hard: { base: 175, floor: 75, ramp: 5 },
};

export interface Point {
  x: number;
  y: number;
}

export interface TrailState {
  size: number;
  snake: Point[];
  dir: Dir;
  /** Up to two turns; each tick consumes at most one, so sharp chords can't 180° into the body. */
  inputQueue: Dir[];
  food: Point;
  score: number;
  alive: boolean;
  cleared: boolean;
}

const MAX_QUEUED_TURNS = 2;

export function boardSizeFor(mobile: boolean): number {
  return mobile ? SIZE_MOBILE : SIZE_DESKTOP;
}

export function cellCount(size: number): number {
  return size * size;
}

export function opposite(dir: Dir): Dir {
  switch (dir) {
    case "up":
      return "down";
    case "down":
      return "up";
    case "left":
      return "right";
    case "right":
      return "left";
  }
}

export function pointKey(p: Point): string {
  return `${p.x},${p.y}`;
}

export function pointsEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

export function inBounds(p: Point, size: number): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < size && p.y < size;
}

export function stepPoint(p: Point, dir: Dir): Point {
  switch (dir) {
    case "up":
      return { x: p.x, y: p.y - 1 };
    case "down":
      return { x: p.x, y: p.y + 1 };
    case "left":
      return { x: p.x - 1, y: p.y };
    case "right":
      return { x: p.x + 1, y: p.y };
  }
}

export function queueDir(state: TrailState, next: Dir): TrailState {
  if (!state.alive || state.cleared) return state;

  const queue = state.inputQueue;
  const facing = queue.length > 0 ? queue[queue.length - 1]! : state.dir;
  if (next === opposite(facing)) return state;
  if (queue[queue.length - 1] === next) return state;

  if (queue.length >= MAX_QUEUED_TURNS) {
    // Replace the last queued turn if it's still legal after the first.
    const afterFirst = queue[0]!;
    if (next === opposite(afterFirst) || afterFirst === next) return state;
    return { ...state, inputQueue: [afterFirst, next] };
  }

  return { ...state, inputQueue: [...queue, next] };
}

function occupiedSet(snake: Point[]): Set<string> {
  const set = new Set<string>();
  for (const p of snake) set.add(pointKey(p));
  return set;
}

export function spawnFood(
  snake: Point[],
  size: number,
  rand: () => number = Math.random,
): Point | null {
  const taken = occupiedSet(snake);
  const free: Point[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!taken.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(rand() * free.length)]!;
}

export function foodScore(length: number): number {
  return 10 + Math.max(0, length - START_LENGTH) * 2;
}

/** Tick interval: starts calm, ramps as the snake grows; paced by difficulty. */
export function tickMsForLength(length: number, difficulty: Difficulty = "normal"): number {
  const cfg = TICK[difficulty];
  const gained = Math.max(0, length - START_LENGTH);
  return Math.max(cfg.floor, cfg.base - gained * cfg.ramp);
}

export function createStartState(
  size: number = SIZE_DESKTOP,
  rand: () => number = Math.random,
): TrailState {
  const mid = Math.floor(size / 2);
  const snake: Point[] = [];
  for (let i = 0; i < START_LENGTH; i++) {
    snake.push({ x: mid - i, y: mid });
  }
  const food = spawnFood(snake, size, rand) ?? { x: Math.min(size - 1, mid + 2), y: mid };
  return {
    size,
    snake,
    dir: "right",
    inputQueue: [],
    food,
    score: 0,
    alive: true,
    cleared: false,
  };
}

export function step(state: TrailState, rand: () => number = Math.random): TrailState {
  if (!state.alive || state.cleared) return state;

  const { size } = state;
  const dir = state.inputQueue[0] ?? state.dir;
  const inputQueue = state.inputQueue.length > 0 ? state.inputQueue.slice(1) : [];
  const head = state.snake[0]!;
  const nextHead = stepPoint(head, dir);

  if (!inBounds(nextHead, size)) {
    return { ...state, dir, inputQueue: [], alive: false };
  }

  const willGrow = pointsEqual(nextHead, state.food);
  const bodyToCheck = willGrow ? state.snake : state.snake.slice(0, -1);
  for (const segment of bodyToCheck) {
    if (pointsEqual(segment, nextHead)) {
      return { ...state, dir, inputQueue: [], alive: false };
    }
  }

  const snake = [nextHead, ...state.snake];
  if (!willGrow) {
    snake.pop();
    return { ...state, snake, dir, inputQueue };
  }

  const score = state.score + foodScore(snake.length);
  if (snake.length >= cellCount(size)) {
    return {
      ...state,
      snake,
      dir,
      inputQueue: [],
      score,
      food: nextHead,
      cleared: true,
      alive: true,
    };
  }

  const food = spawnFood(snake, size, rand);
  if (!food) {
    return {
      ...state,
      snake,
      dir,
      inputQueue: [],
      score,
      food: nextHead,
      cleared: true,
      alive: true,
    };
  }

  return { ...state, snake, dir, inputQueue, food, score };
}
