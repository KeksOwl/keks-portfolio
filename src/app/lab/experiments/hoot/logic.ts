/** Tile level 1…11 maps to classic values 2…2048 (value = 2^level). Higher allowed after win. */
export const SIZE = 4;
export const WIN_LEVEL = 11;

export type Cell = number | null;
export type Board = Cell[];
export type Dir = "up" | "down" | "left" | "right";

export interface MoveResult {
  board: Board;
  scoreGain: number;
  moved: boolean;
  merged: boolean;
}

export function emptyBoard(): Board {
  return Array.from({ length: SIZE * SIZE }, () => null);
}

export function cloneBoard(board: Board): Board {
  return board.slice();
}

export function boardsEqual(a: Board, b: Board): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function emptyIndices(board: Board): number[] {
  const out: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] == null) out.push(i);
  }
  return out;
}

/** Classic spawn: ~90% level 1, ~10% level 2. */
export function randomSpawnLevel(rand: () => number = Math.random): number {
  return rand() < 0.9 ? 1 : 2;
}

export function spawnTile(
  board: Board,
  rand: () => number = Math.random,
): Board | null {
  const empties = emptyIndices(board);
  if (empties.length === 0) return null;
  const idx = empties[Math.floor(rand() * empties.length)]!;
  const next = cloneBoard(board);
  next[idx] = randomSpawnLevel(rand);
  return next;
}

export function createStartBoard(rand: () => number = Math.random): Board {
  let board = emptyBoard();
  board = spawnTile(board, rand) ?? board;
  board = spawnTile(board, rand) ?? board;
  return board;
}

/** Score for merging two tiles of `level` into `level + 1`. */
export function mergeScore(level: number): number {
  return 2 ** (level + 1);
}

function slideLine(line: Cell[]): { line: Cell[]; scoreGain: number; merged: boolean } {
  const compact = line.filter((c): c is number => c != null);
  const out: Cell[] = [];
  let scoreGain = 0;
  let merged = false;
  let i = 0;

  while (i < compact.length) {
    const cur = compact[i]!;
    if (i + 1 < compact.length && compact[i + 1] === cur) {
      out.push(cur + 1);
      scoreGain += mergeScore(cur);
      merged = true;
      i += 2;
    } else {
      out.push(cur);
      i += 1;
    }
  }

  while (out.length < SIZE) out.push(null);
  return { line: out, scoreGain, merged };
}

function getLineIndices(dir: Dir, lane: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < SIZE; i++) {
    switch (dir) {
      case "left":
        indices.push(lane * SIZE + i);
        break;
      case "right":
        indices.push(lane * SIZE + (SIZE - 1 - i));
        break;
      case "up":
        indices.push(i * SIZE + lane);
        break;
      case "down":
        indices.push((SIZE - 1 - i) * SIZE + lane);
        break;
    }
  }
  return indices;
}

export function moveBoard(board: Board, dir: Dir): MoveResult {
  const next = cloneBoard(board);
  let scoreGain = 0;
  let merged = false;

  for (let lane = 0; lane < SIZE; lane++) {
    const indices = getLineIndices(dir, lane);
    const line = indices.map((idx) => board[idx] ?? null);
    const slid = slideLine(line);
    scoreGain += slid.scoreGain;
    if (slid.merged) merged = true;
    for (let i = 0; i < SIZE; i++) {
      next[indices[i]!] = slid.line[i] ?? null;
    }
  }

  const moved = !boardsEqual(board, next);
  return { board: next, scoreGain, moved, merged };
}

export interface TrackedTile {
  id: number;
  level: number;
  index: number;
  /** Will bump level after the slide completes */
  pendingMerge?: boolean;
  /** Merge pop after settle (level already bumped) */
  merged?: boolean;
  /** Just spawned */
  fresh?: boolean;
  /** Lost a merge — still animating into the survivor cell, then removed */
  exiting?: boolean;
}

export interface TrackedMoveResult {
  tiles: TrackedTile[];
  scoreGain: number;
  moved: boolean;
  merged: boolean;
}

/**
 * Move with stable tile ids. Absorbed tiles stay as `exiting` and slide into
 * the merge cell so they don't vanish mid-board (looks like a teleport).
 */
export function moveTrackedTiles(tiles: TrackedTile[], dir: Dir): TrackedMoveResult {
  const byIndex = new Map<number, TrackedTile>();
  for (const t of tiles) {
    if (!t.exiting) byIndex.set(t.index, t);
  }

  const next: TrackedTile[] = [];
  let scoreGain = 0;
  let anyMerged = false;
  let moved = false;

  for (let lane = 0; lane < SIZE; lane++) {
    const indices = getLineIndices(dir, lane);
    const line: TrackedTile[] = [];
    for (const idx of indices) {
      const t = byIndex.get(idx);
      if (t) line.push(t);
    }

    let slot = 0;
    let i = 0;
    while (i < line.length) {
      const cur = line[i]!;
      const nxt = line[i + 1];
      const dest = indices[slot]!;

      if (nxt && nxt.level === cur.level) {
        scoreGain += mergeScore(cur.level);
        anyMerged = true;
        if (cur.index !== dest || nxt.index !== dest) moved = true;
        // Keep pre-merge level while sliding; bump after the slide in UI.
        next.push({ id: cur.id, level: cur.level, index: dest, pendingMerge: true });
        next.push({ id: nxt.id, level: nxt.level, index: dest, exiting: true });
        slot += 1;
        i += 2;
      } else {
        if (cur.index !== dest) moved = true;
        next.push({ id: cur.id, level: cur.level, index: dest });
        slot += 1;
        i += 1;
      }
    }
  }

  return { tiles: next, scoreGain, moved, merged: anyMerged };
}

/** Finalize merges after the slide: drop exiting tiles, bump survivor levels. */
export function settleMergedTiles(tiles: TrackedTile[]): TrackedTile[] {
  const settled: TrackedTile[] = [];
  for (const t of tiles) {
    if (t.exiting) continue;
    if (t.pendingMerge) {
      settled.push({ id: t.id, level: t.level + 1, index: t.index, merged: true });
    } else {
      settled.push({ id: t.id, level: t.level, index: t.index });
    }
  }
  return settled;
}

export function boardFromTracked(tiles: TrackedTile[]): Board {
  const board = emptyBoard();
  for (const t of tiles) {
    if (t.exiting) continue;
    board[t.index] = t.level;
  }
  return board;
}

export function spawnTrackedTile(
  tiles: TrackedTile[],
  nextId: () => number,
  rand: () => number = Math.random,
): TrackedTile | null {
  const board = boardFromTracked(tiles);
  const empties = emptyIndices(board);
  if (empties.length === 0) return null;
  const index = empties[Math.floor(rand() * empties.length)]!;
  return {
    id: nextId(),
    level: randomSpawnLevel(rand),
    index,
    fresh: true,
  };
}

export function hasWon(board: Board, winLevel = WIN_LEVEL): boolean {
  return board.some((c) => c != null && c >= winLevel);
}

export function canMove(board: Board): boolean {
  if (emptyIndices(board).length > 0) return true;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[r * SIZE + c];
      if (v == null) continue;
      if (c + 1 < SIZE && board[r * SIZE + c + 1] === v) return true;
      if (r + 1 < SIZE && board[(r + 1) * SIZE + c] === v) return true;
    }
  }
  return false;
}

export function maxLevel(board: Board): number {
  let max = 0;
  for (const c of board) {
    if (c != null && c > max) max = c;
  }
  return max;
}
