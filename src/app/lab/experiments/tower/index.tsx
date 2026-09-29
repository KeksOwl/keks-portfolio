"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider/locale-provider";
import { HEROES, HeroFace, isHero, type Hero } from "../hero-faces";
import shared from "../shared.module.scss";
import { useLeaveConfirm } from "../use-leave-confirm";
import { useRestartKey } from "../use-restart-key";
import styles from "./cupcake-tower.module.scss";
import en from "../../lab.en.json";
import ru from "../../lab.ru.json";
import {
  WORLD,
  type Block,
  type CutSide,
  type Difficulty,
  type TowerState,
  createStartState,
  dropBlock,
  heightOf,
  movingLeft,
  speedFor,
  topBlock,
} from "./logic";

const dicts = { en, ru };
const HERO_KEY = "lab-tower-hero";
const DIFFICULTY_KEY = "lab-tower-difficulty";
const STORAGE_PREFIX = "lab-tower-best:";
const MOBILE_MQ = "(max-width: 767px)";
const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

/** Block height in px; the tower is measured in these. */
const BLOCK_H = { desktop: 30, mobile: 26 } as const;
/** Keep the moving block no higher than this fraction of the arena. */
const CAMERA_ANCHOR = 0.56;
const PIECE_MS = 720;
const POP_MS = 760;
const PIECE_MS_REDUCED = 160;
/** Let the missed block fall before the end screen covers it. */
const MISS_OVERLAY_DELAY_MS = 460;
const NO_FLASH = -1;

type Phase = "idle" | "playing" | "over";

interface FallingPiece {
  id: number;
  block: Block;
  /** Stack level the piece fell from (base = 0). */
  level: number;
  side: CutSide;
  withRider: boolean;
}

interface Pop {
  id: number;
  level: number;
  centerPct: number;
  text: string;
}

const PALETTE = [styles.blockA, styles.blockB, styles.blockC];

function readHero(): Hero {
  if (typeof window === "undefined") return "keks";
  try {
    const raw = localStorage.getItem(HERO_KEY);
    return isHero(raw) ? raw : "keks";
  } catch {
    return "keks";
  }
}

function writeHero(hero: Hero) {
  try {
    localStorage.setItem(HERO_KEY, hero);
  } catch {
    // ignore
  }
}

function isDifficulty(value: string | null): value is Difficulty {
  return value === "easy" || value === "normal" || value === "hard";
}

function readDifficulty(): Difficulty {
  if (typeof window === "undefined") return "normal";
  try {
    const raw = localStorage.getItem(DIFFICULTY_KEY);
    return isDifficulty(raw) ? raw : "normal";
  } catch {
    return "normal";
  }
}

function writeDifficulty(difficulty: Difficulty) {
  try {
    localStorage.setItem(DIFFICULTY_KEY, difficulty);
  } catch {
    // ignore
  }
}

function storageKey(difficulty: Difficulty) {
  return `${STORAGE_PREFIX}${difficulty}`;
}

function readBest(difficulty: Difficulty): number {
  if (typeof window === "undefined") return 0;
  try {
    const n = Number(localStorage.getItem(storageKey(difficulty)) ?? 0);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeBest(difficulty: Difficulty, score: number) {
  try {
    localStorage.setItem(storageKey(difficulty), String(score));
  } catch {
    // ignore
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_MQ).matches;
}

function pct(units: number): string {
  return `${(units / WORLD) * 100}%`;
}

function isDropKey(e: KeyboardEvent): boolean {
  return e.code === "Space" || e.code === "Enter" || e.code === "ArrowDown" || e.code === "KeyS";
}

export default function CupcakeTower() {
  const { locale } = useLocale();
  const dict = dicts[locale];
  const copy = dict.experiments.tower;

  const arenaRef = useRef<HTMLDivElement>(null);
  const movingRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("idle");
  const stateRef = useRef<TowerState | null>(null);
  const difficultyRef = useRef<Difficulty>(readDifficulty());
  const reducedRef = useRef(false);
  const spawnAtRef = useRef(0);
  const hiddenAtRef = useRef<number | null>(null);
  const idRef = useRef(0);
  const fxTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const [phase, setPhase] = useState<Phase>("idle");
  const [hero, setHero] = useState<Hero>(readHero);
  const [difficulty, setDifficulty] = useState<Difficulty>(readDifficulty);
  const [state, setState] = useState<TowerState>(createStartState);
  const [best, setBest] = useState(() => readBest(readDifficulty()));
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const [mobile, setMobile] = useState(isMobileViewport);
  const [arenaH, setArenaH] = useState(0);
  const [pieces, setPieces] = useState<FallingPiece[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const [flashId, setFlashId] = useState(NO_FLASH);

  useLeaveConfirm(phase === "playing", dict.leaveConfirm);

  const syncState = useCallback((next: TowerState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearFxTimers = useCallback(() => {
    fxTimersRef.current.forEach((t) => clearTimeout(t));
    fxTimersRef.current.clear();
  }, []);

  const scheduleFx = useCallback((fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      fxTimersRef.current.delete(timer);
      fn();
    }, ms);
    fxTimersRef.current.add(timer);
  }, []);

  /** Where the moving block is right now, in world units. */
  const currentLeft = useCallback((now: number): number => {
    const cur = stateRef.current;
    if (!cur) return 0;
    const top = topBlock(cur);
    const speed = speedFor(heightOf(cur), difficultyRef.current);
    return movingLeft(top.width, speed, now - spawnAtRef.current, cur.fromRight);
  }, []);

  // Slide the moving block straight in the DOM; React only re-renders on drops.
  useEffect(() => {
    if (phase !== "playing") return;

    let raf = 0;
    const tick = () => {
      if (phaseRef.current !== "playing") return;
      const el = movingRef.current;
      if (el && hiddenAtRef.current == null) {
        el.style.left = pct(currentLeft(performance.now()));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [currentLeft, phase]);

  const persistBest = useCallback((nextScore: number, forDifficulty: Difficulty) => {
    setBest((prev) => {
      if (nextScore <= prev) return prev;
      writeBest(forDifficulty, nextScore);
      return nextScore;
    });
  }, []);

  const endRun = useCallback(
    (next: TowerState) => {
      // Input is closed at once; the overlay waits for the fall animation.
      phaseRef.current = "over";
      persistBest(next.score, difficultyRef.current);
      const finish = () => setPhase("over");
      if (reducedRef.current) finish();
      else scheduleFx(finish, MISS_OVERLAY_DELAY_MS);
    },
    [persistBest, scheduleFx],
  );

  const addPiece = useCallback(
    (block: Block, level: number, side: CutSide) => {
      const id = ++idRef.current;
      const piece: FallingPiece = { id, block, level, side, withRider: side === "whole" };
      setPieces((prev) => [...prev.slice(-6), piece]);
      scheduleFx(() => {
        setPieces((prev) => prev.filter((p) => p.id !== id));
      }, reducedRef.current ? PIECE_MS_REDUCED : PIECE_MS);
    },
    [scheduleFx],
  );

  const addPop = useCallback(
    (placed: Block, level: number, text: string) => {
      const id = ++idRef.current;
      const centerPct = ((placed.left + placed.width / 2) / WORLD) * 100;
      setPops((prev) => [...prev.slice(-4), { id, level, centerPct, text }]);
      scheduleFx(() => {
        setPops((prev) => prev.filter((p) => p.id !== id));
      }, reducedRef.current ? PIECE_MS_REDUCED : POP_MS);
    },
    [scheduleFx],
  );

  const drop = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    if (hiddenAtRef.current != null) return;

    const cur = stateRef.current;
    if (!cur) return;
    const now = performance.now();
    const left = currentLeft(now);
    const level = cur.blocks.length;
    const result = dropBlock(cur, left, difficultyRef.current);

    spawnAtRef.current = now;
    syncState(result.state);

    if (result.cut && result.cutSide) {
      addPiece(result.cut, level, result.cutSide);
    }
    if (result.perfect && result.placed) {
      addPop(result.placed, level, `${copy.perfect} +${result.gain}`);
      setFlashId(level);
    }
    if (!result.state.alive) endRun(result.state);
  }, [addPiece, addPop, copy.perfect, currentLeft, endRun, syncState]);

  // After every commit (spawn, drop, restart) place the block before paint so the
  // rAF loop never fights a stale React-managed `left`.
  useLayoutEffect(() => {
    const el = movingRef.current;
    if (!el || phaseRef.current !== "playing") return;
    el.style.left = pct(currentLeft(performance.now()));
  }, [currentLeft, state, phase]);

  const startGame = useCallback(() => {
    clearFxTimers();
    setPieces([]);
    setPops([]);
    setFlashId(NO_FLASH);
    hiddenAtRef.current = null;
    difficultyRef.current = difficulty;
    const next = createStartState();
    syncState(next);
    spawnAtRef.current = performance.now();
    phaseRef.current = "playing";
    setPhase("playing");
    // Space/Enter must drop a block, not re-trigger whatever button was last clicked.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }, [clearFxTimers, difficulty, syncState]);

  useRestartKey(phase === "over", startGame);

  const selectHero = useCallback((next: Hero) => {
    if (phaseRef.current === "playing") return;
    setHero(next);
    writeHero(next);
  }, []);

  const selectDifficulty = useCallback((next: Difficulty) => {
    if (phaseRef.current === "playing") return;
    difficultyRef.current = next;
    setDifficulty(next);
    writeDifficulty(next);
    setBest(readBest(next));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      reducedRef.current = mq.matches;
      setReduced(mq.matches);
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Track arena height so the camera can keep the action in view.
  useLayoutEffect(() => {
    const arena = arenaRef.current;
    if (!arena) return;
    const measure = () => setArenaH(arena.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(arena);
    return () => ro.disconnect();
  }, []);

  // Pause the slide while the tab is hidden so the block doesn't teleport on return.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") {
        if (hiddenAtRef.current == null) hiddenAtRef.current = performance.now();
        return;
      }
      if (hiddenAtRef.current != null) {
        spawnAtRef.current += performance.now() - hiddenAtRef.current;
        hiddenAtRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => () => clearFxTimers(), [clearFxTimers]);

  // Keyboard drop
  useEffect(() => {
    if (phase !== "playing") return;

    const onKey = (e: KeyboardEvent) => {
      if (!isDropKey(e)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      if (e.repeat) return;
      drop();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drop, phase]);

  // While playing, block page scroll if the gesture started on the arena.
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

  const blockH = mobile ? BLOCK_H.mobile : BLOCK_H.desktop;
  const top = topBlock(state);
  const height = heightOf(state);
  const score = phase === "idle" ? 0 : state.score;
  const combo = phase === "playing" ? state.combo : 0;
  const movingLevel = state.blocks.length;
  const cameraPx = Math.max(0, (movingLevel + 1) * blockH - arenaH * CAMERA_ANCHOR);
  const showOverlay = phase !== "playing";

  return (
    <div>
      <div className={shared.toolbar}>
        <span className={shared.toolLabel}>{dict.hero}</span>
        {HEROES.map((h) => (
          <button
            key={h}
            type="button"
            className={`${shared.toolBtn} ${hero === h ? shared.toolBtnActive : ""}`}
            disabled={phase === "playing"}
            onClick={() => selectHero(h)}
          >
            {dict[h]}
          </button>
        ))}
      </div>

      <div className={shared.toolbar}>
        <span className={shared.toolLabel}>{dict.difficulty}</span>
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            type="button"
            className={`${shared.toolBtn} ${difficulty === d ? shared.toolBtnActive : ""}`}
            disabled={phase === "playing"}
            onClick={() => selectDifficulty(d)}
          >
            {dict[d]}
          </button>
        ))}
        <button
          type="button"
          className={`${shared.toolBtn} ${styles.toolbarEnd}`}
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
          {dict.best} <span className={shared.hudValue}>{best}</span>
        </span>
        <span>
          {copy.height} <span className={shared.hudAccent}>{height}</span>
        </span>
        <span>
          {dict.combo} <span className={shared.hudValue}>×{combo}</span>
        </span>
      </div>

      <div
        ref={arenaRef}
        className={`${shared.arena} ${shared.arenaTall} ${
          phase === "playing" ? shared.arenaPlaying : ""
        }`}
        data-no-paw
      >
        <div
          className={styles.stage}
          role="img"
          aria-label={`${copy.title}: ${copy.height} ${height}, ${dict.score} ${score}`}
          onPointerDown={(e) => {
            if (phaseRef.current !== "playing") return;
            if (e.pointerType === "mouse" && e.button !== 0) return;
            e.preventDefault();
            drop();
          }}
        >
          <div
            className={`${styles.world} ${reduced ? styles.worldReduced : ""}`}
            style={{ transform: `translateY(${cameraPx}px)` }}
          >
            <div className={styles.ground} />

            {state.blocks.map((b, i) => (
              <div
                key={i}
                className={[
                  styles.block,
                  PALETTE[i % PALETTE.length],
                  i === 0 ? styles.base : "",
                  i === flashId && !reduced ? styles.blockPerfect : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  left: pct(b.left),
                  width: pct(b.width),
                  bottom: i * blockH,
                  height: blockH,
                }}
              />
            ))}

            {phase === "playing" && state.alive && (
              <div
                ref={movingRef}
                className={`${styles.block} ${PALETTE[movingLevel % PALETTE.length]} ${styles.moving}`}
                style={{
                  width: pct(top.width),
                  bottom: movingLevel * blockH,
                  height: blockH,
                }}
              >
                <span className={styles.rider} aria-hidden="true">
                  <HeroFace hero={hero} className={styles.riderSvg} />
                </span>
              </div>
            )}

            {pieces.map((p) => (
              <div
                key={p.id}
                className={[
                  styles.block,
                  PALETTE[p.level % PALETTE.length],
                  styles.piece,
                  reduced ? styles.pieceReduced : "",
                  p.side === "left"
                    ? styles.pieceLeft
                    : p.side === "right"
                      ? styles.pieceRight
                      : styles.pieceWhole,
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  left: pct(p.block.left),
                  width: pct(p.block.width),
                  bottom: p.level * blockH,
                  height: blockH,
                }}
                aria-hidden="true"
              >
                {p.withRider && (
                  <span className={styles.rider}>
                    <HeroFace hero={hero} className={styles.riderSvg} />
                  </span>
                )}
              </div>
            ))}

            {pops.map((p) => (
              <span
                key={p.id}
                className={`${styles.pop} ${reduced ? styles.popReduced : ""}`}
                style={{
                  left: `${p.centerPct}%`,
                  // Clear the moving block's row so the label doesn't collide with it.
                  bottom: (p.level + 2) * blockH + 8,
                }}
                aria-hidden="true"
              >
                {p.text}
              </span>
            ))}
          </div>
        </div>

        {showOverlay && (
          <div className={shared.overlay}>
            {phase === "idle" && (
              <>
                <p className={shared.overlayTitle}>{dict.ready}</p>
                <p className={shared.overlayMeta}>
                  {dict[hero]} · {dict[difficulty]}
                </p>
                <button type="button" className={shared.playBtn} onClick={startGame}>
                  {dict.play}
                </button>
                <p className={shared.keyHint}>{copy.dropKey}</p>
              </>
            )}
            {phase === "over" && (
              <>
                <p className={shared.overlayTitle}>
                  {dict.score}: {score}
                </p>
                <p className={shared.overlayMeta}>
                  {copy.height}: {height} · {dict.best} ({dict[difficulty]}): {best}
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
