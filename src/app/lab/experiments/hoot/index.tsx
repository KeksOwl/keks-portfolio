"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider/locale-provider";
import shared from "../shared.module.scss";
import { useLeaveConfirm } from "../use-leave-confirm";
import { useRestartKey } from "../use-restart-key";
import styles from "./hoot-stack.module.scss";
import en from "../../lab.en.json";
import ru from "../../lab.ru.json";
import {
  SIZE,
  WIN_LEVEL,
  type Dir,
  type TrackedTile,
  boardFromTracked,
  canMove,
  createStartBoard,
  hasWon,
  maxLevel,
  moveTrackedTiles,
  settleMergedTiles,
  spawnTrackedTile,
} from "./logic";

const dicts = { en, ru };
const STORAGE_KEY = "lab-hoot-best";
const SWIPE_MIN = 28;
const GAP = 8;
const SLIDE_MS = 150;
const FLAG_CLEAR_MS = 220;
const SLIDE_EASE = "cubic-bezier(0.22, 0.8, 0.28, 1)";

type Phase = "idle" | "playing" | "won" | "over";

const STAGE_LABELS_EN = [
  "",
  "peep",
  "hoot",
  "hoo",
  "whoo",
  "whoot",
  "uh-huh",
  "big who",
  "elder",
  "horned",
  "night",
  "HOOT!",
] as const;

const STAGE_LABELS_RU = [
  "",
  "пик",
  "ух",
  "уху",
  "ухух",
  "у-хух",
  "филин",
  "сыч",
  "старец",
  "рогач",
  "ночь",
  "УХУХ",
] as const;

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

function lvlClass(level: number): string {
  if (level >= 12) return styles.lvlMax;
  const map: Record<number, string> = {
    1: styles.lvl1,
    2: styles.lvl2,
    3: styles.lvl3,
    4: styles.lvl4,
    5: styles.lvl5,
    6: styles.lvl6,
    7: styles.lvl7,
    8: styles.lvl8,
    9: styles.lvl9,
    10: styles.lvl10,
    11: styles.lvl11,
  };
  return map[level] ?? styles.lvl1;
}

function stageLabel(level: number, locale: "en" | "ru"): string {
  const labels = locale === "ru" ? STAGE_LABELS_RU : STAGE_LABELS_EN;
  if (level >= WIN_LEVEL) return labels[WIN_LEVEL]!;
  return labels[level] ?? String(2 ** level);
}

function keyToDir(code: string): Dir | null {
  switch (code) {
    case "ArrowUp":
    case "KeyW":
      return "up";
    case "ArrowDown":
    case "KeyS":
      return "down";
    case "ArrowLeft":
    case "KeyA":
      return "left";
    case "ArrowRight":
    case "KeyD":
      return "right";
    default:
      return null;
  }
}

function tilesFromBoard(
  board: ReturnType<typeof createStartBoard>,
  idRef: { current: number },
  fresh: boolean,
): TrackedTile[] {
  const next: TrackedTile[] = [];
  board.forEach((level, index) => {
    if (level == null) return;
    next.push({ id: ++idRef.current, level, index, fresh });
  });
  return next;
}

function tilePos(index: number): { row: number; col: number } {
  return { row: Math.floor(index / SIZE), col: index % SIZE };
}

/** Static cell box — CSS resolves % against the layer; no JS measuring. */
function tileBox(index: number): { left: string; top: string; size: string } {
  const { row, col } = tilePos(index);
  const size = `calc((100% - ${(SIZE - 1) * GAP}px) / ${SIZE})`;
  const step = `((100% - ${(SIZE - 1) * GAP}px) / ${SIZE} + ${GAP}px)`;
  return {
    size,
    left: `calc(${col} * ${step})`,
    top: `calc(${row} * ${step})`,
  };
}

export default function HootStack() {
  const { locale } = useLocale();
  const dict = dicts[locale];
  const copy = dict.experiments.hoot;
  const arenaRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const scoreRef = useRef(0);
  const wonOnceRef = useRef(false);
  const busyRef = useRef(false);
  const tilesRef = useRef<TrackedTile[]>([]);
  const nodeRefs = useRef(new Map<number, HTMLDivElement>());
  const flipFromRef = useRef<Map<number, DOMRect> | null>(null);
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(readBest);
  const [tiles, setTiles] = useState<TrackedTile[]>([]);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const [goalPeak, setGoalPeak] = useState(0);

  useLeaveConfirm(phase === "playing", dict.leaveConfirm);

  const syncTiles = useCallback((next: TrackedTile[]) => {
    tilesRef.current = next;
    setTiles(next);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(
    () => () => {
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    },
    [],
  );

  const persistBest = useCallback((nextScore: number) => {
    setBest((prev) => {
      if (nextScore <= prev) return prev;
      writeBest(nextScore);
      return nextScore;
    });
  }, []);

  const clearAnimFlags = useCallback(() => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      clearTimerRef.current = null;
      const cur = tilesRef.current;
      if (!cur.some((t) => t.fresh || t.merged)) return;
      syncTiles(cur.map((t) => ({ id: t.id, level: t.level, index: t.index })));
    }, FLAG_CLEAR_MS);
  }, [syncTiles]);

  const finishAfterBoard = useCallback((boardTiles: TrackedTile[]) => {
    const board = boardFromTracked(boardTiles);
    setGoalPeak((p) => Math.max(p, maxLevel(board)));

    if (!wonOnceRef.current && hasWon(board)) {
      wonOnceRef.current = true;
      phaseRef.current = "won";
      setPhase("won");
      busyRef.current = false;
      return;
    }

    if (!canMove(board)) {
      phaseRef.current = "over";
      setPhase("over");
    }
    busyRef.current = false;
  }, []);

  // FLIP: after React commits new left/top, animate from previous rects via WAAPI.
  useLayoutEffect(() => {
    const fromRects = flipFromRef.current;
    if (!fromRects) return;
    flipFromRef.current = null;

    if (reduced || fromRects.size === 0) return;

    for (const tile of tilesRef.current) {
      const el = nodeRefs.current.get(tile.id);
      const from = fromRects.get(tile.id);
      if (!el || !from) continue;

      const to = el.getBoundingClientRect();
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;

      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
        { duration: SLIDE_MS, easing: SLIDE_EASE },
      );
    }
  }, [tiles, reduced]);

  const startGame = useCallback(() => {
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    flipFromRef.current = null;
    busyRef.current = false;
    idRef.current = 0;
    wonOnceRef.current = false;
    scoreRef.current = 0;
    const board = createStartBoard();
    const next = tilesFromBoard(board, idRef, true);
    syncTiles(next);
    setScore(0);
    setGoalPeak(maxLevel(board));
    phaseRef.current = "playing";
    setPhase("playing");
    clearAnimFlags();
  }, [clearAnimFlags, syncTiles]);

  useRestartKey(phase === "over" || phase === "won", startGame);

  const continueAfterWin = useCallback(() => {
    phaseRef.current = "playing";
    setPhase("playing");
  }, []);

  const applyMove = useCallback(
    (dir: Dir) => {
      if (phaseRef.current !== "playing" || busyRef.current) return;

      const result = moveTrackedTiles(tilesRef.current, dir);
      if (!result.moved) return;

      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      if (spawnTimerRef.current) {
        clearTimeout(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }

      busyRef.current = true;
      scoreRef.current += result.scoreGain;
      setScore(scoreRef.current);
      persistBest(scoreRef.current);

      // Snapshot rects BEFORE React moves left/top
      if (!reduced) {
        const fromRects = new Map<number, DOMRect>();
        for (const t of tilesRef.current) {
          const el = nodeRefs.current.get(t.id);
          if (el) fromRects.set(t.id, el.getBoundingClientRect());
        }
        flipFromRef.current = fromRects;
      }

      syncTiles(result.tiles);

      const delay = reduced ? 0 : SLIDE_MS;
      spawnTimerRef.current = setTimeout(() => {
        spawnTimerRef.current = null;
        const settled = settleMergedTiles(tilesRef.current);
        const spawned = spawnTrackedTile(settled, () => ++idRef.current);
        const withSpawn = spawned ? [...settled, spawned] : settled;
        // No FLIP for settle/spawn — tiles stay put; only level/pop changes
        flipFromRef.current = null;
        syncTiles(withSpawn);
        clearAnimFlags();
        finishAfterBoard(withSpawn);
      }, delay);
    },
    [clearAnimFlags, finishAfterBoard, persistBest, reduced, syncTiles],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current !== "playing") return;
      const dir = keyToDir(e.code);
      if (!dir) return;
      e.preventDefault();
      applyMove(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyMove]);

  // Real phones scroll the *page* unless touchmove is canceled on document
  // (arena-only listeners are flaky once the browser starts a scroll gesture).
  useEffect(() => {
    const arena = arenaRef.current;
    if (!arena || phase !== "playing") return;

    let fingerId: number | null = null;
    let startX = 0;
    let startY = 0;

    const onStart = (e: TouchEvent) => {
      if (fingerId != null) return;
      const t = e.changedTouches[0];
      if (!t) return;
      fingerId = t.identifier;
      startX = t.clientX;
      startY = t.clientY;
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

    const onEnd = (e: TouchEvent) => {
      if (fingerId == null) return;
      let t: Touch | undefined;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i]!.identifier === fingerId) {
          t = e.changedTouches[i];
          break;
        }
      }
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      fingerId = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        applyMove(dx > 0 ? "right" : "left");
      } else {
        applyMove(dy > 0 ? "down" : "up");
      }
    };

    const onCancel = (e: TouchEvent) => {
      if (fingerId == null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i]!.identifier === fingerId) {
          fingerId = null;
          return;
        }
      }
    };

    arena.addEventListener("touchstart", onStart, { passive: true });
    // Document-level: keep blocking scroll / finish swipe even if finger leaves the arena.
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", onCancel, { passive: true });

    return () => {
      arena.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onCancel);
    };
  }, [phase, applyMove]);

  const showOverlay = phase === "idle" || phase === "won" || phase === "over";

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

      <div className={shared.hud}>
        <span>
          {dict.score} <span className={shared.hudValue}>{score}</span>
        </span>
        <span>
          {dict.best} <span className={shared.hudValue}>{best}</span>
        </span>
        <span className={styles.goal}>
          {dict.goal}{" "}
          <span className={shared.hudAccent}>
            {stageLabel(Math.max(goalPeak, 1), locale)}
            {goalPeak < WIN_LEVEL ? ` → ${stageLabel(WIN_LEVEL, locale)}` : ""}
          </span>
        </span>
      </div>

      <div
        ref={arenaRef}
        className={`${shared.arena} ${phase === "playing" ? shared.arenaPlaying : ""}`}
        data-no-paw
      >
        <div className={styles.stage}>
          <div className={styles.boardWrap}>
            <div className={styles.grid} aria-hidden="true">
              {Array.from({ length: SIZE * SIZE }, (_, i) => (
                <div key={i} className={styles.slot} />
              ))}
            </div>
            <div className={styles.tileLayer}>
              {tiles.map((tile) => {
                const box = tileBox(tile.index);
                return (
                  <div
                    key={tile.id}
                    ref={(el) => {
                      if (el) nodeRefs.current.set(tile.id, el);
                      else nodeRefs.current.delete(tile.id);
                    }}
                    className={[
                      styles.tile,
                      tile.exiting ? styles.tileExiting : "",
                      reduced ? styles.tileReduced : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      left: box.left,
                      top: box.top,
                      width: box.size,
                      height: box.size,
                    }}
                  >
                    <div
                      className={[
                        styles.face,
                        lvlClass(tile.level),
                        tile.fresh && !reduced ? styles.tileNew : "",
                        tile.merged && !reduced ? styles.tileMerged : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span className={styles.mark} aria-hidden="true" />
                      <span className={styles.label}>{stageLabel(tile.level, locale)}</span>
                      <span className={styles.power} aria-hidden="true">
                        {2 ** tile.level}
                      </span>
                    </div>
                  </div>
                );
              })}
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
            {phase === "won" && (
              <>
                <p className={shared.overlayTitle}>{dict.won}</p>
                <p className={shared.overlayMeta}>
                  {dict.score}: {score} · {dict.best}: {best}
                </p>
                <div className={styles.overlayActions}>
                  <button type="button" className={shared.playBtn} onClick={continueAfterWin}>
                    {dict.continue}
                  </button>
                  <button type="button" className={styles.ghostBtn} onClick={startGame}>
                    {dict.newGame}
                  </button>
                </div>
                <p className={shared.keyHint}>{dict.againKey}</p>
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
                <p className={shared.keyHint}>{dict.againKey}</p>
              </>
            )}
          </div>
        )}
      </div>

      <p className={shared.hint}>{copy.hint}</p>
    </div>
  );
}
