/**
 * Cupcake tower model. The horizontal axis is an abstract world of WORLD units
 * (the UI maps units → percent of the arena width), so the rules don't care
 * about pixels or viewport size.
 *
 * A run is a stack of blocks. The moving block slides back and forth above the
 * top block; dropping it keeps only the overlap and the overhang falls away.
 * Landing within the tolerance is a "perfect": the block keeps its full width,
 * the combo grows, and a streak of perfects widens the tower back a little.
 *
 * Pure and side-effect free so the rules stay unit-testable.
 */
export const WORLD = 1000;
export const BASE_WIDTH = 440;
/** Overlaps thinner than this count as a miss — slivers aren't playable. */
export const MIN_WIDTH = 6;
/** Consecutive perfects needed before the block widens again. */
export const GROW_STREAK = 3;

export type Difficulty = "easy" | "normal" | "hard";
export type Hero = "owl" | "cat" | "keks";

interface DifficultyConfig {
  /** Starting speed, units per second. */
  speed: number;
  /** Speed added per placed block. */
  ramp: number;
  /** Speed ceiling. */
  cap: number;
  /** Max |offset| from the top block that still counts as perfect. */
  tolerance: number;
  /** Width gained on a perfect streak. */
  grow: number;
}

const CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { speed: 340, ramp: 9, cap: 800, tolerance: 34, grow: 28 },
  normal: { speed: 440, ramp: 13, cap: 1040, tolerance: 24, grow: 22 },
  hard: { speed: 560, ramp: 18, cap: 1300, tolerance: 15, grow: 16 },
};

export interface Block {
  left: number;
  width: number;
}

export interface TowerState {
  /** Base first, top last. */
  blocks: Block[];
  /** Consecutive perfects, reset by any imperfect drop. */
  combo: number;
  score: number;
  alive: boolean;
  /** Side the moving block enters from; alternates every drop. */
  fromRight: boolean;
}

export type CutSide = "left" | "right" | "whole";

export interface DropResult {
  state: TowerState;
  /** Block that landed on the tower, or null on a miss. */
  placed: Block | null;
  /** Piece that falls away: the overhang, or the whole block on a miss. */
  cut: Block | null;
  cutSide: CutSide | null;
  perfect: boolean;
  gain: number;
}

export function topBlock(state: TowerState): Block {
  return state.blocks[state.blocks.length - 1]!;
}

/** Placed blocks, not counting the base. */
export function heightOf(state: TowerState): number {
  return state.blocks.length - 1;
}

export function speedFor(height: number, difficulty: Difficulty): number {
  const cfg = CONFIG[difficulty];
  return Math.min(cfg.cap, cfg.speed + Math.max(0, height) * cfg.ramp);
}

export function toleranceFor(difficulty: Difficulty): number {
  return CONFIG[difficulty].tolerance;
}

/**
 * Left edge of the moving block after `elapsedMs`, bouncing between the world
 * edges as a triangle wave. Starts flush against the entry side.
 */
export function movingLeft(
  width: number,
  speed: number,
  elapsedMs: number,
  fromRight: boolean,
): number {
  const range = Math.max(0, WORLD - width);
  if (range === 0) return 0;
  const travel = (Math.max(0, elapsedMs) / 1000) * speed;
  const period = range * 2;
  const phase = travel % period;
  const fromLeftPos = phase <= range ? phase : period - phase;
  return fromRight ? range - fromLeftPos : fromLeftPos;
}

/** Score for one landed block. Perfects pay more and scale with the streak. */
export function dropGain(perfect: boolean, comboAfter: number): number {
  if (!perfect) return 10;
  return 20 + Math.min(30, Math.max(0, comboAfter - 1) * 5);
}

export function createStartState(): TowerState {
  const left = Math.round((WORLD - BASE_WIDTH) / 2);
  return {
    blocks: [{ left, width: BASE_WIDTH }],
    combo: 0,
    score: 0,
    alive: true,
    fromRight: false,
  };
}

function clampBlock(block: Block): Block {
  const width = Math.min(BASE_WIDTH, block.width);
  const left = Math.min(Math.max(0, block.left), WORLD - width);
  return { left, width };
}

export function dropBlock(state: TowerState, left: number, difficulty: Difficulty): DropResult {
  if (!state.alive) {
    return { state, placed: null, cut: null, cutSide: null, perfect: false, gain: 0 };
  }

  const top = topBlock(state);
  const width = top.width;
  const moving: Block = { left, width };
  const offset = left - top.left;
  const tolerance = toleranceFor(difficulty);

  if (Math.abs(offset) <= tolerance) {
    const combo = state.combo + 1;
    const gain = dropGain(true, combo);
    let placed: Block = { left: top.left, width };
    if (combo % GROW_STREAK === 0 && width < BASE_WIDTH) {
      const grow = CONFIG[difficulty].grow;
      placed = clampBlock({ left: placed.left - grow / 2, width: width + grow });
    }
    return {
      state: {
        ...state,
        blocks: [...state.blocks, placed],
        combo,
        score: state.score + gain,
        fromRight: !state.fromRight,
      },
      placed,
      cut: null,
      cutSide: null,
      perfect: true,
      gain,
    };
  }

  const overlapLeft = Math.max(left, top.left);
  const overlapRight = Math.min(left + width, top.left + width);
  const overlapWidth = overlapRight - overlapLeft;

  if (overlapWidth < MIN_WIDTH) {
    return {
      state: { ...state, combo: 0, alive: false },
      placed: null,
      cut: moving,
      cutSide: "whole",
      perfect: false,
      gain: 0,
    };
  }

  const placed: Block = { left: overlapLeft, width: overlapWidth };
  const cutSide: CutSide = offset > 0 ? "right" : "left";
  const cut: Block =
    cutSide === "right"
      ? { left: overlapRight, width: left + width - overlapRight }
      : { left, width: overlapLeft - left };
  const gain = dropGain(false, 0);

  return {
    state: {
      ...state,
      blocks: [...state.blocks, placed],
      combo: 0,
      score: state.score + gain,
      fromRight: !state.fromRight,
    },
    placed,
    cut,
    cutSide,
    perfect: false,
    gain,
  };
}
