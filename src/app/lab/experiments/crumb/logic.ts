/**
 * Cupcake match-3 model. Board is a flat COLS*ROWS grid, index = row * COLS + col.
 * A `Kind` (0…KIND_COUNT-1) is a cupcake flavour. The board is always full during
 * a settled state; holes appear only transiently while collapsing/refilling.
 *
 * Pure and seedable (inject `rand`) so the rules stay unit-testable.
 */
export const COLS = 7;
export const ROWS = 7;
export const CELL_COUNT = COLS * ROWS;
export const KIND_COUNT = 5;
export const GAP = 6; // keep in sync with $gap in crumb-match.module.scss
export const MOVES = 25;
export const MIN_MATCH = 3;

export type Kind = number;

export interface Tile {
  id: number;
  kind: Kind;
  index: number;
}

export function rowOf(index: number): number {
  return Math.floor(index / COLS);
}

export function colOf(index: number): number {
  return index % COLS;
}

export function areAdjacent(a: number, b: number): boolean {
  if (a === b) return false;
  const ra = rowOf(a);
  const rb = rowOf(b);
  const ca = colOf(a);
  const cb = colOf(b);
  return (ra === rb && Math.abs(ca - cb) === 1) || (ca === cb && Math.abs(ra - rb) === 1);
}

function randomKind(rand: () => number): Kind {
  return Math.floor(rand() * KIND_COUNT);
}

/** Build a full board with no pre-existing matches (greedy, avoids completing a run of 3). */
export function createInitialKinds(rand: () => number = Math.random): Kind[] {
  const kinds: Kind[] = new Array(CELL_COUNT).fill(-1);
  for (let i = 0; i < CELL_COUNT; i++) {
    const r = rowOf(i);
    const c = colOf(i);
    let kind: Kind;
    let tries = 0;
    do {
      kind = randomKind(rand);
      tries++;
    } while (
      tries < 40 &&
      ((c >= 2 && kinds[i - 1] === kind && kinds[i - 2] === kind) ||
        (r >= 2 && kinds[i - COLS] === kind && kinds[i - 2 * COLS] === kind))
    );
    kinds[i] = kind;
  }
  return kinds;
}

export function tilesFromKinds(kinds: Kind[], nextId: () => number): Tile[] {
  return kinds.map((kind, index) => ({ id: nextId(), kind, index }));
}

export function kindsFromTiles(tiles: Tile[]): Kind[] {
  const arr: Kind[] = new Array(CELL_COUNT).fill(-1);
  for (const t of tiles) arr[t.index] = t.kind;
  return arr;
}

/** Indices belonging to any horizontal or vertical run of MIN_MATCH+ equal kinds. */
export function findMatchedIndices(kinds: Kind[]): Set<number> {
  const matched = new Set<number>();

  // Horizontal runs
  for (let r = 0; r < ROWS; r++) {
    let runStart = 0;
    for (let c = 1; c <= COLS; c++) {
      const idx = r * COLS + c;
      const prev = r * COLS + (c - 1);
      const same = c < COLS && kinds[idx] >= 0 && kinds[idx] === kinds[prev];
      if (!same) {
        const runLen = c - runStart;
        if (runLen >= MIN_MATCH) {
          for (let k = runStart; k < c; k++) matched.add(r * COLS + k);
        }
        runStart = c;
      }
    }
  }

  // Vertical runs
  for (let c = 0; c < COLS; c++) {
    let runStart = 0;
    for (let r = 1; r <= ROWS; r++) {
      const idx = r * COLS + c;
      const prev = (r - 1) * COLS + c;
      const same = r < ROWS && kinds[idx] >= 0 && kinds[idx] === kinds[prev];
      if (!same) {
        const runLen = r - runStart;
        if (runLen >= MIN_MATCH) {
          for (let k = runStart; k < r; k++) matched.add(k * COLS + c);
        }
        runStart = r;
      }
    }
  }

  return matched;
}

/** Tile ids that are part of a match in the current layout. */
export function matchedTileIds(tiles: Tile[]): Set<number> {
  const kinds = kindsFromTiles(tiles);
  const indices = findMatchedIndices(kinds);
  const ids = new Set<number>();
  for (const t of tiles) {
    if (indices.has(t.index)) ids.add(t.id);
  }
  return ids;
}

function swapKinds(kinds: Kind[], a: number, b: number): Kind[] {
  const copy = kinds.slice();
  const tmp = copy[a]!;
  copy[a] = copy[b]!;
  copy[b] = tmp;
  return copy;
}

export function swapCreatesMatch(kinds: Kind[], a: number, b: number): boolean {
  if (!areAdjacent(a, b)) return false;
  return findMatchedIndices(swapKinds(kinds, a, b)).size > 0;
}

/** True if at least one adjacent swap produces a match. */
export function hasAnyMove(kinds: Kind[]): boolean {
  for (let i = 0; i < CELL_COUNT; i++) {
    const c = colOf(i);
    if (c < COLS - 1 && swapCreatesMatch(kinds, i, i + 1)) return true;
    if (i + COLS < CELL_COUNT && swapCreatesMatch(kinds, i, i + COLS)) return true;
  }
  return false;
}

/**
 * Remove `clearedIds`, let survivors fall to the bottom of their column, then spawn
 * fresh tiles into the vacated top cells. Stable ids preserved for FLIP animation.
 */
export function collapseAndRefill(
  tiles: Tile[],
  clearedIds: Set<number>,
  nextId: () => number,
  rand: () => number = Math.random,
): { tiles: Tile[]; spawnedIds: Set<number> } {
  const alive = tiles.filter((t) => !clearedIds.has(t.id));
  const result: Tile[] = [];
  const spawnedIds = new Set<number>();

  for (let c = 0; c < COLS; c++) {
    const column = alive
      .filter((t) => colOf(t.index) === c)
      .sort((a, b) => a.index - b.index); // top -> bottom
    const survivors = column.length;
    const holes = ROWS - survivors;

    // Survivors settle at the bottom, preserving their vertical order.
    for (let i = 0; i < survivors; i++) {
      const row = holes + i;
      result.push({ id: column[i]!.id, kind: column[i]!.kind, index: row * COLS + c });
    }

    // Fresh cupcakes fill the top holes.
    for (let row = 0; row < holes; row++) {
      const id = nextId();
      result.push({ id, kind: randomKind(rand), index: row * COLS + c });
      spawnedIds.add(id);
    }
  }

  return { tiles: result, spawnedIds };
}

/** Score for clearing a run/group of `count` cupcakes during cascade `step` (1-based). */
export function scoreForClear(count: number, step: number): number {
  const base = count * 10;
  const runBonus = count >= 5 ? 50 : count === 4 ? 20 : 0;
  return (base + runBonus) * step;
}

/**
 * Reshuffle the board's kinds (ids/indices kept) into a layout that has no immediate
 * match and at least one available move. Falls back to a fresh generated board.
 */
export function reshuffleTiles(tiles: Tile[], rand: () => number = Math.random): Tile[] {
  const kinds = tiles.map((t) => t.kind);

  for (let attempt = 0; attempt < 30; attempt++) {
    for (let i = kinds.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = kinds[i]!;
      kinds[i] = kinds[j]!;
      kinds[j] = tmp;
    }
    const byIndex: Kind[] = new Array(CELL_COUNT).fill(-1);
    tiles.forEach((t, i) => {
      byIndex[t.index] = kinds[i]!;
    });
    if (findMatchedIndices(byIndex).size === 0 && hasAnyMove(byIndex)) {
      return tiles.map((t) => ({ id: t.id, index: t.index, kind: byIndex[t.index]! }));
    }
  }

  // Fallback: regenerate flavours entirely, keep tile ids/indices.
  let fresh = createInitialKinds(rand);
  let guard = 0;
  while (!hasAnyMove(fresh) && guard++ < 20) fresh = createInitialKinds(rand);
  return tiles
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((t) => ({ id: t.id, index: t.index, kind: fresh[t.index]! }));
}
