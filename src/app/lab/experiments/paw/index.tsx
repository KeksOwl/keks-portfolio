"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider/locale-provider";
import shared from "../shared.module.scss";
import { useLeaveConfirm } from "../use-leave-confirm";
import styles from "./paw-rush.module.scss";
import en from "../../lab.en.json";
import ru from "../../lab.ru.json";

const dicts = { en, ru };
const ROUND_MS = 30_000;
const STORAGE_PREFIX = "lab-paw-best:";
const DIE_MS = 220;
const SPAWN_GAP = 14;
const SPAWN_TRIES = 48;

type Difficulty = "easy" | "normal" | "hard";
type Phase = "idle" | "playing" | "over";

interface Target {
  id: number;
  x: number;
  y: number;
  lifeMs: number;
  dying?: boolean;
}

interface Fx {
  id: number;
  x: number;
  y: number;
  gain: number;
}

const DIFFICULTY: Record<
  Difficulty,
  { life: number; spawnMin: number; spawnMax: number; maxOnScreen: number }
> = {
  easy: { life: 1600, spawnMin: 420, spawnMax: 780, maxOnScreen: 3 },
  normal: { life: 1200, spawnMin: 280, spawnMax: 620, maxOnScreen: 4 },
  hard: { life: 880, spawnMin: 180, spawnMax: 420, maxOnScreen: 5 },
};

/** Target diameter by difficulty. Desktop hard ≈ former default; mobile normal ≈ same. */
const TARGET_SIZE: Record<"desktop" | "mobile", Record<Difficulty, number>> = {
  desktop: { easy: 80, normal: 68, hard: 56 },
  mobile: { easy: 66, normal: 56, hard: 48 },
};

const MOBILE_MQ = "(max-width: 767px)";

function targetSizeFor(d: Difficulty, mobile: boolean): number {
  return TARGET_SIZE[mobile ? "mobile" : "desktop"][d];
}

function storageKey(d: Difficulty) {
  return `${STORAGE_PREFIX}${d}`;
}

function readBest(d: Difficulty): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(storageKey(d));
    if (raw != null) {
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    }
    if (d === "normal") {
      const legacy = Number(localStorage.getItem("lab-paw-best") ?? 0);
      return Number.isFinite(legacy) ? legacy : 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

function writeBest(d: Difficulty, score: number) {
  try {
    localStorage.setItem(storageKey(d), String(score));
  } catch {
    // ignore
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pickPosition(
  w: number,
  h: number,
  size: number,
  existing: Target[],
): { x: number; y: number } | null {
  const pad = size / 2 + 8;
  const minDist = size + SPAWN_GAP;

  for (let i = 0; i < SPAWN_TRIES; i++) {
    const x = pad + Math.random() * Math.max(1, w - pad * 2);
    const y = pad + Math.random() * Math.max(1, h - pad * 2);
    const clear = existing.every((t) => !t.dying && Math.hypot(t.x - x, t.y - y) >= minDist);
    if (clear) return { x, y };
  }
  return null;
}

export default function PawRush() {
  const { locale } = useLocale();
  const dict = dicts[locale];
  const arenaRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const difficultyRef = useRef<Difficulty>("normal");
  const mobileRef = useRef(false);
  const targetsRef = useRef<Target[]>([]);
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lifeTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const dieTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const [phase, setPhase] = useState<Phase>("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(() => readBest("normal"));
  const [timeLeft, setTimeLeft] = useState(ROUND_MS / 1000);
  const [targets, setTargets] = useState<Target[]>([]);
  const [fx, setFx] = useState<Fx[]>([]);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const [mobile, setMobile] = useState(false);

  useLeaveConfirm(phase === "playing", dict.leaveConfirm);

  const syncTargets = useCallback((next: Target[] | ((prev: Target[]) => Target[])) => {
    setTargets((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      targetsRef.current = resolved;
      return resolved;
    });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const onChange = () => {
      mobileRef.current = mq.matches;
      setMobile(mq.matches);
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const selectDifficulty = (next: Difficulty) => {
    if (phaseRef.current === "playing") return;
    setDifficulty(next);
    difficultyRef.current = next;
    setBest(readBest(next));
  };

  const clearTimers = useCallback(() => {
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    if (endTimerRef.current) clearTimeout(endTimerRef.current);
    spawnTimerRef.current = null;
    tickTimerRef.current = null;
    endTimerRef.current = null;
    lifeTimersRef.current.forEach((t) => clearTimeout(t));
    lifeTimersRef.current.clear();
    dieTimersRef.current.forEach((t) => clearTimeout(t));
    dieTimersRef.current.clear();
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    syncTargets([]);
    phaseRef.current = "over";
    setPhase("over");
    const d = difficultyRef.current;
    setBest((prev) => {
      const next = Math.max(prev, scoreRef.current);
      if (next > prev) writeBest(d, next);
      return next;
    });
  }, [clearTimers, syncTargets]);

  const expireTarget = useCallback(
    (id: number) => {
      lifeTimersRef.current.delete(id);

      if (reduced || prefersReducedMotion()) {
        syncTargets((prev) => {
          if (!prev.some((t) => t.id === id)) return prev;
          comboRef.current = 0;
          setCombo(0);
          return prev.filter((t) => t.id !== id);
        });
        return;
      }

      syncTargets((prev) => {
        if (!prev.some((t) => t.id === id) || prev.find((t) => t.id === id)?.dying) return prev;
        return prev.map((t) => (t.id === id ? { ...t, dying: true } : t));
      });

      const dieTimer = setTimeout(() => {
        dieTimersRef.current.delete(id);
        syncTargets((prev) => {
          if (!prev.some((t) => t.id === id)) return prev;
          comboRef.current = 0;
          setCombo(0);
          return prev.filter((t) => t.id !== id);
        });
      }, DIE_MS);
      dieTimersRef.current.set(id, dieTimer);
    },
    [reduced, syncTargets],
  );

  const spawnTarget = useCallback(() => {
    const arena = arenaRef.current;
    if (!arena || phaseRef.current !== "playing") return;

    const cfg = DIFFICULTY[difficultyRef.current];
    const size = targetSizeFor(difficultyRef.current, mobileRef.current);
    const alive = targetsRef.current.filter((t) => !t.dying);
    if (alive.length >= cfg.maxOnScreen) return;

    const pos = pickPosition(arena.clientWidth, arena.clientHeight, size, alive);
    if (!pos) return;

    const id = ++idRef.current;
    const lifeMs = prefersReducedMotion() ? cfg.life * 1.35 : cfg.life;
    const target: Target = { id, x: pos.x, y: pos.y, lifeMs };

    syncTargets((prev) => [...prev.filter((t) => !t.dying || t.id !== id), target].slice(-cfg.maxOnScreen - 2));

    const timer = setTimeout(() => expireTarget(id), lifeMs);
    lifeTimersRef.current.set(id, timer);
  }, [expireTarget, syncTargets]);

  const start = useCallback(() => {
    clearTimers();
    idRef.current = 0;
    comboRef.current = 0;
    scoreRef.current = 0;
    difficultyRef.current = difficulty;
    setScore(0);
    setCombo(0);
    syncTargets([]);
    setFx([]);
    setTimeLeft(ROUND_MS / 1000);
    phaseRef.current = "playing";
    setPhase("playing");

    const cfg = DIFFICULTY[difficulty];
    const startedAt = Date.now();
    tickTimerRef.current = setInterval(() => {
      const left = Math.max(0, ROUND_MS - (Date.now() - startedAt));
      setTimeLeft(Math.ceil(left / 1000));
    }, 200);

    const scheduleSpawn = () => {
      const delay =
        cfg.spawnMin +
        Math.random() * (cfg.spawnMax - cfg.spawnMin) -
        Math.min(160, comboRef.current * 10);

      spawnTimerRef.current = setTimeout(() => {
        if (phaseRef.current !== "playing") return;
        if (document.visibilityState === "visible") spawnTarget();
        scheduleSpawn();
      }, Math.max(140, delay));
    };

    endTimerRef.current = setTimeout(finish, ROUND_MS);
    spawnTarget();
    scheduleSpawn();
  }, [clearTimers, difficulty, finish, spawnTarget, syncTargets]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // While playing, block page scroll if the gesture started on the arena.
  // Arena-only touchmove is flaky on real phones — lock on document instead.
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

  const hit = (target: Target) => {
    if (phaseRef.current !== "playing") return;
    // Allow hits during fade-out — if it's still visible, it should score
    if (!targetsRef.current.some((t) => t.id === target.id)) return;

    const lifeTimer = lifeTimersRef.current.get(target.id);
    if (lifeTimer) {
      clearTimeout(lifeTimer);
      lifeTimersRef.current.delete(target.id);
    }
    const dieTimer = dieTimersRef.current.get(target.id);
    if (dieTimer) {
      clearTimeout(dieTimer);
      dieTimersRef.current.delete(target.id);
    }

    comboRef.current += 1;
    const gain = 10 + Math.min(40, (comboRef.current - 1) * 4);
    scoreRef.current += gain;
    setScore(scoreRef.current);
    setCombo(comboRef.current);
    syncTargets((prev) => prev.filter((t) => t.id !== target.id));

    const fxId = ++idRef.current;
    setFx((prev) => [...prev.slice(-8), { id: fxId, x: target.x, y: target.y, gain }]);
    setTimeout(() => {
      setFx((prev) => prev.filter((f) => f.id !== fxId));
    }, reduced ? 200 : 560);
  };

  const targetSize = targetSizeFor(difficulty, mobile);
  const difficulties: Difficulty[] = ["easy", "normal", "hard"];

  return (
    <div>
      <div className={shared.toolbar} data-paw-target>
        <span className={shared.toolLabel}>{dict.difficulty}</span>
        {difficulties.map((d) => (
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
          {dict.time}{" "}
          <span className={shared.hudValue}>{phase === "playing" ? timeLeft : ROUND_MS / 1000}s</span>
        </span>
      </div>

      <div
        ref={arenaRef}
        className={`${shared.arena} ${shared.arenaTall} ${shared.arenaPaw} ${
          phase === "playing" ? shared.arenaPlaying : ""
        }`}
        data-no-paw
      >
        {targets.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.target} ${reduced ? styles.targetReduced : ""} ${t.dying ? styles.dying : ""}`}
            style={{
              left: t.x,
              top: t.y,
              width: targetSize,
              height: targetSize,
              marginLeft: -targetSize / 2,
              marginTop: -targetSize / 2,
              ["--life-ms" as string]: `${Math.max(200, t.lifeMs - 160)}ms`,
            }}
            aria-label="target"
            onPointerDown={(e) => {
              e.preventDefault();
              hit(t);
            }}
          />
        ))}
        {fx.map((f) => (
          <span key={f.id} aria-hidden="true">
            <span className={styles.hitRing} style={{ left: f.x, top: f.y }} />
            <span className={styles.hitScore} style={{ left: f.x, top: f.y }}>
              +{f.gain}
            </span>
          </span>
        ))}

        {phase !== "playing" && (
          <div className={shared.overlay}>
            <p className={shared.overlayTitle}>
              {phase === "idle" ? dict.ready : `${dict.score}: ${score}`}
            </p>
            {phase === "over" && (
              <p className={shared.overlayMeta}>
                {dict.best} ({dict[difficulty]}): {best}
              </p>
            )}
            <button type="button" className={shared.playBtn} onClick={start}>
              {phase === "idle" ? dict.play : dict.again}
            </button>
          </div>
        )}
      </div>

      <p className={shared.hint}>{dict.experiments.paw.hint}</p>
    </div>
  );
}
