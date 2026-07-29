"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider/locale-provider";
import shared from "../shared.module.scss";
import { useLeaveConfirm } from "../use-leave-confirm";
import styles from "./crumb-match.module.scss";
import en from "../../lab.en.json";
import ru from "../../lab.ru.json";
import {
  CELL_COUNT,
  COLS,
  GAP,
  MOVES,
  type Tile,
  areAdjacent,
  collapseAndRefill,
  colOf,
  createInitialKinds,
  hasAnyMove,
  kindsFromTiles,
  matchedTileIds,
  reshuffleTiles,
  rowOf,
  scoreForClear,
  swapCreatesMatch,
  tilesFromKinds,
} from "./logic";

const dicts = { en, ru };
const STORAGE_KEY = "lab-crumb-best";
const SLIDE_MS = 160;
const FALL_MS = 210;
const CLEAR_MS = 150;
const SLIDE_EASE = "cubic-bezier(0.22, 0.8, 0.28, 1)";
const FALL_EASE = "cubic-bezier(0.3, 0.7, 0.3, 1)";
const SWIPE_MIN = 18;
const EMPTY_IDS: Set<number> = new Set();

type Phase = "idle" | "playing" | "over";

const KIND_CLASS = [styles.k0, styles.k1, styles.k2, styles.k3, styles.k4];

function readBest(): number {
  if (typeof window === "undefined") return 0;
  try {
    const n = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeBest(score: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // ignore
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Static cell box — CSS resolves % against the tile layer; no JS measuring. */
function tileBox(index: number): { left: string; top: string; size: string } {
  const row = rowOf(index);
  const col = colOf(index);
  const size = `calc((100% - ${(COLS - 1) * GAP}px) / ${COLS})`;
  const step = `((100% - ${(COLS - 1) * GAP}px) / ${COLS} + ${GAP}px)`;
  return {
    size,
    left: `calc(${col} * ${step})`,
    top: `calc(${row} * ${step})`,
  };
}

function neighborInDirection(index: number, dx: number, dy: number): number | null {
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx > 0) return colOf(index) < COLS - 1 ? index + 1 : null;
    return colOf(index) > 0 ? index - 1 : null;
  }
  if (dy > 0) return index + COLS < CELL_COUNT ? index + COLS : null;
  return index - COLS >= 0 ? index - COLS : null;
}

interface CupcakeTileProps {
  id: number;
  kind: number;
  index: number;
  clearing: boolean;
  selected: boolean;
  registerNode: (id: number, el: HTMLButtonElement | null) => void;
}

/**
 * Memoized so HUD updates (score/combo) don't re-render 49 tiles; only tiles whose
 * kind/index/clearing/selected actually change are reconciled.
 */
const CupcakeTile = memo(function CupcakeTile({
  id,
  kind,
  index,
  clearing,
  selected,
  registerNode,
}: CupcakeTileProps) {
  const box = tileBox(index);
  return (
    <button
      type="button"
      data-id={id}
      data-index={index}
      ref={(el) => registerNode(id, el)}
      className={clearing ? `${styles.tile} ${styles.tileClearing}` : styles.tile}
      style={{ left: box.left, top: box.top, width: box.size, height: box.size }}
      aria-label="cupcake"
    >
      <span className={selected ? `${styles.face} ${styles.faceSelected}` : styles.face}>
        <span
          className={`${styles.cupcake} ${KIND_CLASS[kind] ?? styles.k0}`}
          aria-hidden="true"
        >
          <span className={styles.topping} />
        </span>
      </span>
    </button>
  );
});

export default function CrumbMatch() {
  const { locale } = useLocale();
  const dict = dicts[locale];
  const copy = dict.experiments.crumb;

  const arenaRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const busyRef = useRef(false);
  const scoreRef = useRef(0);
  const movesRef = useRef(MOVES);
  const tilesRef = useRef<Tile[]>([]);
  const selectedRef = useRef<number | null>(null);
  const nodeRefs = useRef(new Map<number, HTMLButtonElement>());
  const flipFromRef = useRef<Map<number, DOMRect> | null>(null);
  const spawnIdsRef = useRef<Set<number>>(EMPTY_IDS);
  const pointerStartRef = useRef<{ index: number; x: number; y: number } | null>(null);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const resolveRef = useRef<(step: number) => void>(() => {});

  const [phase, setPhase] = useState<Phase>("idle");
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(readBest);
  const [combo, setCombo] = useState(0);
  const [movesLeft, setMovesLeft] = useState(MOVES);
  const [clearingIds, setClearingIds] = useState<Set<number>>(() => new Set());
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useLeaveConfirm(phase === "playing", dict.leaveConfirm);

  const nextId = useCallback(() => ++idRef.current, []);

  const registerNode = useCallback((id: number, el: HTMLButtonElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else nodeRefs.current.delete(id);
  }, []);

  const syncTiles = useCallback((next: Tile[]) => {
    tilesRef.current = next;
    setTiles(next);
  }, []);

  const setSelectedIndex = useCallback((index: number | null) => {
    selectedRef.current = index;
    setSelected(index);
  }, []);

  const after = useCallback((ms: number, fn: () => void) => {
    const t = setTimeout(() => {
      timersRef.current.delete(t);
      fn();
    }, ms);
    timersRef.current.add(t);
    return t;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const persistBest = useCallback((nextScore: number) => {
    setBest((prev) => {
      if (nextScore <= prev) return prev;
      writeBest(nextScore);
      return nextScore;
    });
  }, []);

  const captureFlip = useCallback(() => {
    if (reduced) {
      flipFromRef.current = null;
      return;
    }
    const rects = new Map<number, DOMRect>();
    for (const t of tilesRef.current) {
      const el = nodeRefs.current.get(t.id);
      if (el) rects.set(t.id, el.getBoundingClientRect());
    }
    flipFromRef.current = rects;
  }, [reduced]);

  // FLIP: after React commits new left/top, slide survivors from their previous rect
  // and let freshly spawned cupcakes fall in from above the board.
  useLayoutEffect(() => {
    const fromRects = flipFromRef.current;
    const spawnIds = spawnIdsRef.current;
    flipFromRef.current = null;
    spawnIdsRef.current = EMPTY_IDS;

    if (reduced) return;
    if (!fromRects && spawnIds.size === 0) return;

    for (const tile of tilesRef.current) {
      const el = nodeRefs.current.get(tile.id);
      if (!el) continue;

      const from = fromRects?.get(tile.id);
      if (from) {
        const to = el.getBoundingClientRect();
        const dx = from.left - to.left;
        const dy = from.top - to.top;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
        el.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
          { duration: SLIDE_MS, easing: SLIDE_EASE },
        );
      } else if (spawnIds.has(tile.id)) {
        const to = el.getBoundingClientRect();
        const dy = -(rowOf(tile.index) + 1) * (to.height + GAP);
        el.animate(
          [{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }],
          { duration: FALL_MS, easing: FALL_EASE },
        );
      }
    }
  }, [tiles, reduced]);

  const endResolve = useCallback(() => {
    const kinds = kindsFromTiles(tilesRef.current);

    if (movesRef.current <= 0) {
      phaseRef.current = "over";
      setPhase("over");
      persistBest(scoreRef.current);
      busyRef.current = false;
      return;
    }

    if (!hasAnyMove(kinds)) {
      const shuffled = reshuffleTiles(tilesRef.current);
      flipFromRef.current = null;
      syncTiles(shuffled);
    }

    busyRef.current = false;
  }, [persistBest, syncTiles]);

  const resolveCascades = useCallback(
    (step: number) => {
      const matched = matchedTileIds(tilesRef.current);
      if (matched.size === 0) {
        endResolve();
        return;
      }

      const gain = scoreForClear(matched.size, step);
      scoreRef.current += gain;
      setScore(scoreRef.current);
      persistBest(scoreRef.current);
      setCombo(step);

      if (!reduced) setClearingIds(matched);

      after(reduced ? 0 : CLEAR_MS, () => {
        captureFlip();
        const { tiles: next, spawnedIds } = collapseAndRefill(tilesRef.current, matched, nextId);
        spawnIdsRef.current = reduced ? EMPTY_IDS : spawnedIds;
        setClearingIds(EMPTY_IDS);
        syncTiles(next);
        after(reduced ? 0 : FALL_MS, () => resolveRef.current(step + 1));
      });
    },
    [after, captureFlip, endResolve, nextId, persistBest, reduced, syncTiles],
  );

  useEffect(() => {
    resolveRef.current = resolveCascades;
  }, [resolveCascades]);

  const commitSwap = useCallback(
    (next: Tile[]) => {
      busyRef.current = true;
      setCombo(0);
      movesRef.current -= 1;
      setMovesLeft(movesRef.current);
      captureFlip();
      syncTiles(next);
      after(reduced ? 0 : SLIDE_MS, () => resolveCascades(1));
    },
    [after, captureFlip, reduced, resolveCascades, syncTiles],
  );

  const rejectSwap = useCallback(
    (swapped: Tile[], original: Tile[]) => {
      if (reduced) return; // no move consumed, nothing to animate
      busyRef.current = true;
      captureFlip();
      syncTiles(swapped);
      after(SLIDE_MS, () => {
        captureFlip();
        syncTiles(original);
        after(SLIDE_MS, () => {
          busyRef.current = false;
        });
      });
    },
    [after, captureFlip, reduced, syncTiles],
  );

  const attemptSwap = useCallback(
    (a: number, b: number) => {
      if (phaseRef.current !== "playing" || busyRef.current) return;
      if (!areAdjacent(a, b)) return;

      const current = tilesRef.current;
      const ta = current.find((t) => t.index === a);
      const tb = current.find((t) => t.index === b);
      if (!ta || !tb) return;

      const swapped = current.map((t) => {
        if (t.id === ta.id) return { ...t, index: b };
        if (t.id === tb.id) return { ...t, index: a };
        return t;
      });

      const kinds = kindsFromTiles(current);
      if (swapCreatesMatch(kinds, a, b)) {
        commitSwap(swapped);
      } else {
        rejectSwap(swapped, current);
      }
    },
    [commitSwap, rejectSwap],
  );

  const selectTile = useCallback(
    (index: number) => {
      if (phaseRef.current !== "playing" || busyRef.current) return;
      const current = selectedRef.current;
      if (current === null) {
        setSelectedIndex(index);
        return;
      }
      if (current === index) {
        setSelectedIndex(null);
        return;
      }
      if (areAdjacent(current, index)) {
        setSelectedIndex(null);
        attemptSwap(current, index);
        return;
      }
      setSelectedIndex(index);
    },
    [attemptSwap, setSelectedIndex],
  );

  const startGame = useCallback(() => {
    clearTimers();
    flipFromRef.current = null;
    spawnIdsRef.current = EMPTY_IDS;
    busyRef.current = false;
    idRef.current = 0;
    scoreRef.current = 0;
    movesRef.current = MOVES;

    let kinds = createInitialKinds();
    let guard = 0;
    while (!hasAnyMove(kinds) && guard++ < 20) kinds = createInitialKinds();

    const next = tilesFromKinds(kinds, nextId);
    setClearingIds(EMPTY_IDS);
    setSelectedIndex(null);
    setScore(0);
    setCombo(0);
    setMovesLeft(MOVES);
    syncTiles(next);
    phaseRef.current = "playing";
    setPhase("playing");
  }, [clearTimers, nextId, setSelectedIndex, syncTiles]);

  // Single delegated press handler for the whole board (one listener, memo-friendly tiles).
  const onBoardPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== "playing" || busyRef.current) return;
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-index]");
    if (!el) return;
    e.preventDefault();
    pointerStartRef.current = {
      index: Number(el.dataset.index),
      x: e.clientX,
      y: e.clientY,
    };
  }, []);

  // Pointer up anywhere resolves a tap vs. a directional swipe from the pressed tile.
  useEffect(() => {
    const onPointerUp = (e: PointerEvent) => {
      const start = pointerStartRef.current;
      pointerStartRef.current = null;
      if (!start || phaseRef.current !== "playing" || busyRef.current) return;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) >= SWIPE_MIN) {
        const target = neighborInDirection(start.index, dx, dy);
        setSelectedIndex(null);
        if (target !== null) attemptSwap(start.index, target);
      } else {
        selectTile(start.index);
      }
    };

    const onPointerCancel = () => {
      pointerStartRef.current = null;
    };

    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [attemptSwap, selectTile, setSelectedIndex]);

  // Keep the page from scrolling when a drag starts on the board (mobile).
  useEffect(() => {
    const arena = arenaRef.current;
    if (!arena || phase !== "playing") return;

    let fingerId: number | null = null;

    const onStart = (e: TouchEvent) => {
      if (fingerId != null) return;
      const t = e.changedTouches[0];
      if (!t) return;
      fingerId = t.identifier;
    };

    const onMove = (e: TouchEvent) => {
      if (fingerId == null) return;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i]!.identifier === fingerId) {
          if (e.cancelable) e.preventDefault();
          return;
        }
      }
    };

    const clearFinger = (e: TouchEvent) => {
      if (fingerId == null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i]!.identifier === fingerId) {
          fingerId = null;
          return;
        }
      }
    };

    arena.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", clearFinger, { passive: true });
    document.addEventListener("touchcancel", clearFinger, { passive: true });

    return () => {
      arena.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", clearFinger);
      document.removeEventListener("touchcancel", clearFinger);
    };
  }, [phase]);

  const showOverlay = phase === "idle" || phase === "over";

  return (
    <div>
      <div className={shared.toolbar}>
        <button
          type="button"
          className={shared.toolBtn}
          onClick={startGame}
          disabled={phase === "idle"}
        >
          {dict.newGame}
        </button>
      </div>

      <div className={shared.hud} aria-live="polite">
        <span>
          {dict.score} <span className={shared.hudValue}>{score}</span>
        </span>
        <span>
          {dict.combo} <span className={shared.hudAccent}>×{combo}</span>
        </span>
        <span>
          {dict.best} <span className={shared.hudValue}>{best}</span>
        </span>
        <span>
          {dict.moves} <span className={shared.hudValue}>{movesLeft}</span>
        </span>
      </div>

      <div
        ref={arenaRef}
        className={`${shared.arena} ${shared.arenaTall} ${
          phase === "playing" ? shared.arenaPlaying : ""
        }`}
        data-no-paw
      >
        <div className={styles.stage}>
          <div className={styles.boardWrap}>
            <div className={styles.grid} aria-hidden="true">
              {Array.from({ length: CELL_COUNT }, (_, i) => (
                <div key={i} className={styles.slot} />
              ))}
            </div>
            <div className={styles.tileLayer} onPointerDown={onBoardPointerDown}>
              {tiles.map((tile) => (
                <CupcakeTile
                  key={tile.id}
                  id={tile.id}
                  kind={tile.kind}
                  index={tile.index}
                  clearing={clearingIds.has(tile.id)}
                  selected={selected === tile.index}
                  registerNode={registerNode}
                />
              ))}
            </div>
          </div>
        </div>

        {showOverlay && (
          <div className={shared.overlay}>
            {phase === "idle" && (
              <>
                <p className={shared.overlayTitle}>{dict.ready}</p>
                <button type="button" className={shared.playBtn} onClick={startGame}>
                  {dict.play}
                </button>
              </>
            )}
            {phase === "over" && (
              <>
                <p className={shared.overlayTitle}>
                  {dict.score}: {score}
                </p>
                <p className={shared.overlayMeta}>
                  {dict.best}: {best}
                </p>
                <button type="button" className={shared.playBtn} onClick={startGame}>
                  {dict.again}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <p className={shared.hint}>{copy.hint}</p>
    </div>
  );
}
