"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocale } from "@/components/locale-provider/locale-provider";
import shared from "../shared.module.scss";
import { useLeaveConfirm } from "../use-leave-confirm";
import { useRestartKey } from "../use-restart-key";
import styles from "./trail-tail.module.scss";
import en from "../../lab.en.json";
import ru from "../../lab.ru.json";
import {
  MOBILE_MQ,
  START_LENGTH,
  type Difficulty,
  type Dir,
  type Hero,
  type TrailState,
  boardSizeFor,
  createStartState,
  pointKey,
  queueDir,
  step,
  tickMsForLength,
} from "./logic";

const dicts = { en, ru };
const HERO_KEY = "lab-trail-hero";
const DIFFICULTY_KEY = "lab-trail-difficulty";
const STORAGE_PREFIX = "lab-trail-best:";
const SWIPE_MIN = 24;
const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_MQ).matches;
}

type Phase = "idle" | "playing" | "won" | "over";

const HEROES: Hero[] = ["owl", "cat", "keks"];

const BODY_CLASS: Record<Hero, string> = {
  owl: styles.bodyOwl,
  cat: styles.bodyCat,
  keks: styles.bodyKeks,
};

const DIR_ROT: Record<Dir, string> = {
  up: "-90deg",
  down: "90deg",
  left: "180deg",
  right: "0deg",
};

function OwlFace() {
  return (
    <svg className={styles.faceSvg} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M9 3.5 12.5 10H5.5Z" fill="#6d635a" />
      <path d="M23 3.5 26.5 10H19.5Z" fill="#6d635a" />
      <ellipse cx="16" cy="18" rx="12" ry="11.5" fill="#a3988c" />
      <ellipse cx="16" cy="19.5" rx="7" ry="6" fill="#d9d0c4" />
      <circle cx="11.2" cy="17.2" r="4.2" fill="#efe8dc" />
      <circle cx="20.8" cy="17.2" r="4.2" fill="#efe8dc" />
      <circle cx="11.2" cy="17.2" r="1.85" fill="#1a1410" />
      <circle cx="20.8" cy="17.2" r="1.85" fill="#1a1410" />
      <circle cx="10.6" cy="16.6" r="0.55" fill="#f5f0e8" />
      <circle cx="20.2" cy="16.6" r="0.55" fill="#f5f0e8" />
      <path d="M16 19.2 13.4 23.2h5.2Z" fill="#e1ac6e" />
    </svg>
  );
}

function CatFace() {
  return (
    <svg className={styles.faceSvg} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 4.5 13 13H4Z" fill="#e89050" />
      <path d="M25 4.5 28 13H19Z" fill="#e89050" />
      <path d="M8.2 7.2 12.2 12.4H6.4Z" fill="#f4b8a0" />
      <path d="M23.8 7.2 25.6 12.4H20.8Z" fill="#f4b8a0" />
      <circle cx="16" cy="18.5" r="11.2" fill="#f0a060" />
      <ellipse cx="16" cy="22" rx="6.5" ry="4.2" fill="#ffe4c4" />
      <ellipse cx="11.5" cy="17.5" rx="1.7" ry="2.1" fill="#3d6a28" />
      <ellipse cx="20.5" cy="17.5" rx="1.7" ry="2.1" fill="#3d6a28" />
      <circle cx="11.5" cy="17.5" r="0.85" fill="#1a1410" />
      <circle cx="20.5" cy="17.5" r="0.85" fill="#1a1410" />
      <circle cx="11.15" cy="17.05" r="0.35" fill="#fff" />
      <circle cx="20.15" cy="17.05" r="0.35" fill="#fff" />
      <path d="M16 20.2c-.9 0-1.5.55-1.5 1.05S15.1 22.2 16 22.2s1.5-.45 1.5-.95S16.9 20.2 16 20.2Z" fill="#e8909a" />
      <path d="M16 22.2v1.6M14.2 23.4h3.6" stroke="#c86a38" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M6.5 19.5h4.2M6.8 21.2h3.6M21.3 19.5h4.2M21.6 21.2h3.6" stroke="#9a5a32" strokeWidth="0.65" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function KeksFace() {
  return (
    <svg className={styles.faceSvg} viewBox="0 0 32 32" aria-hidden="true">
      {/* liner */}
      <path d="M8 18h16l-1.6 10.2a2 2 0 0 1-2 1.6h-8.8a2 2 0 0 1-2-1.6Z" fill="#e8b888" />
      <path d="M9.2 20h13.6M10 23.2h12M10.8 26.4h10.4" stroke="#c99460" strokeWidth="0.7" opacity="0.55" />
      {/* frosting */}
      <ellipse cx="16" cy="15.5" rx="11.5" ry="8.2" fill="#ffb0c8" />
      <ellipse cx="16" cy="13.2" rx="9.2" ry="5.8" fill="#ffc8d8" />
      <path
        d="M6.2 15.8c2.2-2.4 4.2-.2 5.8-1.8 1.8-1.8 3.2.6 5 .6s3.2-2.4 5-.6c1.6 1.6 3.6-.6 5.8 1.8"
        fill="none"
        stroke="#ff9bb4"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* cherry */}
      <circle cx="16" cy="7.2" r="2.4" fill="#e24b5a" />
      <path d="M16 5.2c.6-1.4 2-2.2 3.2-2.4" fill="none" stroke="#5a8a48" strokeWidth="1" strokeLinecap="round" />
      {/* face */}
      <circle cx="12.2" cy="15.2" r="1.35" fill="#1a1410" />
      <circle cx="19.8" cy="15.2" r="1.35" fill="#1a1410" />
      <circle cx="11.85" cy="14.85" r="0.4" fill="#fff" />
      <circle cx="19.45" cy="14.85" r="0.4" fill="#fff" />
      <path d="M14.2 18.2c.9 1.1 2.7 1.1 3.6 0" fill="none" stroke="#c86a80" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="10.2" cy="17.4" r="1.1" fill="#ff8aa8" opacity="0.7" />
      <circle cx="21.8" cy="17.4" r="1.1" fill="#ff8aa8" opacity="0.7" />
    </svg>
  );
}

function HeroFace({ hero }: { hero: Hero }) {
  if (hero === "owl") return <OwlFace />;
  if (hero === "cat") return <CatFace />;
  return <KeksFace />;
}

function isHero(value: string | null): value is Hero {
  return value === "owl" || value === "cat" || value === "keks";
}

function readHero(): Hero {
  if (typeof window === "undefined") return "owl";
  try {
    const raw = localStorage.getItem(HERO_KEY);
    return isHero(raw) ? raw : "owl";
  } catch {
    return "owl";
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

export default function TrailTail() {
  const { locale } = useLocale();
  const dict = dicts[locale];
  const copy = dict.experiments.trail;
  const arenaRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("idle");
  const stateRef = useRef<TrailState | null>(null);
  const heroRef = useRef<Hero>(readHero());
  const difficultyRef = useRef<Difficulty>(readDifficulty());
  const mobileRef = useRef(isMobileViewport());
  const tickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [hero, setHero] = useState<Hero>(readHero);
  const [difficulty, setDifficulty] = useState<Difficulty>(readDifficulty);
  const [state, setState] = useState<TrailState>(() =>
    createStartState(boardSizeFor(isMobileViewport())),
  );
  const [best, setBest] = useState(() => readBest(readDifficulty()));
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useLeaveConfirm(phase === "playing", dict.leaveConfirm);

  const syncState = useCallback((next: TrailState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearTick = useCallback(() => {
    if (tickTimerRef.current) {
      clearTimeout(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }, []);

  const persistBest = useCallback((nextScore: number, forDifficulty: Difficulty) => {
    setBest((prev) => {
      if (nextScore <= prev) return prev;
      writeBest(forDifficulty, nextScore);
      return nextScore;
    });
  }, []);

  const endRun = useCallback(
    (next: TrailState, result: "won" | "over") => {
      clearTick();
      phaseRef.current = result;
      setPhase(result);
      persistBest(next.score, difficultyRef.current);
    },
    [clearTick, persistBest],
  );

  const scheduleTick = useCallback(() => {
    clearTick();

    const arm = () => {
      const length = stateRef.current?.snake.length ?? START_LENGTH;
      const delay = pausedRef.current
        ? 120
        : tickMsForLength(length, difficultyRef.current);
      tickTimerRef.current = setTimeout(() => {
        tickTimerRef.current = null;
        if (phaseRef.current !== "playing") return;
        if (pausedRef.current) {
          arm();
          return;
        }
        const cur = stateRef.current;
        if (!cur) return;
        const next = step(cur);
        syncState(next);
        if (next.cleared) {
          endRun(next, "won");
          return;
        }
        if (!next.alive) {
          endRun(next, "over");
          return;
        }
        arm();
      }, delay);
    };

    arm();
  }, [clearTick, endRun, syncState]);

  const freshBoard = useCallback(() => createStartState(boardSizeFor(mobileRef.current)), []);

  const startGame = useCallback(() => {
    clearTick();
    pausedRef.current = false;
    difficultyRef.current = difficulty;
    const next = freshBoard();
    syncState(next);
    phaseRef.current = "playing";
    setPhase("playing");
    scheduleTick();
  }, [clearTick, difficulty, freshBoard, scheduleTick, syncState]);

  useRestartKey(phase === "over" || phase === "won", startGame);

  const selectHero = useCallback(
    (next: Hero) => {
      if (phaseRef.current === "playing") return;
      heroRef.current = next;
      setHero(next);
      writeHero(next);
    },
    [],
  );

  const selectDifficulty = useCallback(
    (next: Difficulty) => {
      if (phaseRef.current === "playing") return;
      difficultyRef.current = next;
      setDifficulty(next);
      writeDifficulty(next);
      setBest(readBest(next));
    },
    [],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Resize board on viewport breakpoint changes while not mid-run.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const onChange = () => {
      mobileRef.current = mq.matches;
      if (phaseRef.current === "playing") return;
      syncState(createStartState(boardSizeFor(mq.matches)));
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [syncState]);

  useEffect(() => () => clearTick(), [clearTick]);

  useEffect(() => {
    const onVis = () => {
      pausedRef.current = document.visibilityState !== "visible";
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const steer = useCallback(
    (dir: Dir) => {
      if (phaseRef.current !== "playing") return;
      const cur = stateRef.current;
      if (!cur) return;
      syncState(queueDir(cur, dir));
    },
    [syncState],
  );

  // Keyboard
  useEffect(() => {
    if (phase !== "playing") return;

    const onKey = (e: KeyboardEvent) => {
      const dir = keyToDir(e.code);
      if (!dir) return;
      e.preventDefault();
      steer(dir);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, steer]);

  // Swipe on the board only (pad buttons handle their own taps)
  useEffect(() => {
    const board = boardRef.current;
    if (!board || phase !== "playing") return;

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
      let touch: Touch | null = null;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i]!.identifier === fingerId) {
          touch = e.changedTouches[i]!;
          break;
        }
      }
      fingerId = null;
      if (!touch) return;

      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return;

      const dir: Dir =
        Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
      steer(dir);
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

    board.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", onCancel, { passive: true });

    return () => {
      board.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onCancel);
    };
  }, [phase, steer]);

  const boardSize = state.size;
  const cellTotal = boardSize * boardSize;
  const snakeMap = new Map<string, number>();
  state.snake.forEach((p, i) => snakeMap.set(pointKey(p), i));
  const foodKey = pointKey(state.food);
  const headDir = state.dir;
  const length = state.snake.length;
  const score = phase === "idle" ? 0 : state.score;
  const showOverlay = phase === "idle" || phase === "won" || phase === "over";

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
          {copy.length} <span className={shared.hudAccent}>{length}</span>
        </span>
      </div>

      <div
        ref={arenaRef}
        className={`${shared.arena} ${styles.arenaTrail} ${
          phase === "playing" ? shared.arenaPlaying : ""
        }`}
        data-no-paw
      >
        <div className={styles.stage}>
          <div className={styles.boardSlot}>
            <div
              ref={boardRef}
              className={styles.board}
              role="img"
              aria-label={`${copy.title}: ${dict.score} ${score}`}
              style={{
                gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
                gridTemplateRows: `repeat(${boardSize}, 1fr)`,
              }}
            >
              {Array.from({ length: cellTotal }, (_, i) => {
                const x = i % boardSize;
                const y = Math.floor(i / boardSize);
                const key = `${x},${y}`;
                const seg = snakeMap.get(key);
                const isHead = seg === 0;
                const isBody = seg != null && seg > 0;
                const isFood = key === foodKey && !isHead;
                const fade = isBody ? 1 - seg / Math.max(1, state.snake.length - 1) : 1;

                return (
                  <div
                    key={i}
                    className={[
                      styles.cell,
                      isHead || isBody ? styles.body : "",
                      isHead || isBody ? BODY_CLASS[hero] : "",
                      isHead ? styles.head : "",
                      isFood ? styles.food : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={
                      isBody || isHead
                        ? ({ ["--trail-fade"]: fade } as CSSProperties)
                        : undefined
                    }
                  >
                    {isHead && (
                      <span className={styles.faceWrap} aria-hidden="true">
                        <HeroFace hero={hero} />
                        <span
                          className={`${styles.dirPip} ${reduced ? styles.dirPipReduced : ""}`}
                          style={{ ["--face-rot" as string]: DIR_ROT[headDir] }}
                        />
                      </span>
                    )}
                    {isFood && (
                      <span
                        className={`${styles.crumb} ${reduced ? styles.crumbReduced : ""}`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.pad} role="group" aria-label={copy.pad}>
            {(
              [
                ["up", styles.padUp, "▲", copy.up],
                ["left", styles.padLeft, "◀", copy.left],
                ["right", styles.padRight, "▶", copy.right],
                ["down", styles.padDown, "▼", copy.down],
              ] as const
            ).map(([dir, className, glyph, label]) => (
              <button
                key={dir}
                type="button"
                className={`${styles.padBtn} ${className}`}
                aria-label={label}
                disabled={phase !== "playing"}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  steer(dir);
                }}
              >
                <span aria-hidden="true">{glyph}</span>
              </button>
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
              </>
            )}
            {phase === "won" && (
              <>
                <p className={shared.overlayTitle}>{copy.cleared}</p>
                <p className={shared.overlayMeta}>
                  {dict.score}: {score} · {dict.best}: {best}
                </p>
                <button type="button" className={shared.playBtn} onClick={startGame}>
                  {dict.again}
                </button>
                <p className={shared.keyHint}>{dict.againKey}</p>
              </>
            )}
            {phase === "over" && (
              <>
                <p className={shared.overlayTitle}>
                  {dict.score}: {score}
                </p>
                <p className={shared.overlayMeta}>
                  {dict.best} ({dict[difficulty]}): {best}
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
