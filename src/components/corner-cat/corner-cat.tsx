"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./corner-cat.module.scss";

type CatState = "sleep" | "awake" | "active";

export default function CornerCat() {
  const [state, setState] = useState<CatState>("sleep");
  const idleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollGate = useRef(false);

  const resetIdleTimer = useCallback(() => {
    if (idleTimeout.current) clearTimeout(idleTimeout.current);
    idleTimeout.current = setTimeout(() => setState("sleep"), 3500);
  }, []);

  const wake = useCallback(() => {
    setState((prev) => {
      if (prev === "active") return prev;
      return "awake";
    });
    resetIdleTimer();
  }, [resetIdleTimer]);

  const handleClick = useCallback(() => {
    if (activeTimeout.current) clearTimeout(activeTimeout.current);
    if (idleTimeout.current) clearTimeout(idleTimeout.current);

    setState("active");

    activeTimeout.current = setTimeout(() => {
      setState("awake");
      resetIdleTimer();
    }, 1500);
  }, [resetIdleTimer]);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const onScroll = () => {
      if (scrollGate.current) return;
      scrollGate.current = true;
      requestAnimationFrame(() => {
        wake();
        scrollGate.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (idleTimeout.current) clearTimeout(idleTimeout.current);
      if (activeTimeout.current) clearTimeout(activeTimeout.current);
    };
  }, [wake]);

  return (
    <div
      className={`${styles.cat}${state !== "sleep" ? ` ${styles[state]}` : ""}`}
      onClick={handleClick}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svg}
      >
        {/* Tail */}
        <path
          className={styles.tail}
          d="M14 45 C6 42, 3 35, 8 30 C12 26, 16 30, 14 34"
          stroke="#d4a373"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Body */}
        <g className={styles.bodyWrap}>
          <ellipse
            className={styles.body}
            cx="32"
            cy="44"
            rx="18"
            ry="13"
            fill="#ededed"
          />
        </g>

        {/* Head */}
        <g className={styles.head}>
          {/* Ears */}
          <polygon points="35,18 40,10 46,17" fill="#ededed" />
          <polygon points="46,17 52,9 56,17" fill="#ededed" />
          <polygon points="37,17 40,12 44,17" fill="#d4a373" opacity="0.5" />
          <polygon points="48,17 51,11 54,17" fill="#d4a373" opacity="0.5" />

          {/* Head shape */}
          <ellipse cx="46" cy="24" rx="13" ry="11" fill="#ededed" />

          {/* Eyes */}
          <g className={styles.eyes}>
            {/* Closed eyes (sleep) — two arcs */}
            <path
              className={styles.eyesClosed}
              d="M40 23 Q42 25 44 23 M48 23 Q50 25 52 23"
              stroke="#333"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Open eyes (awake) */}
            <g className={styles.eyesOpen}>
              <ellipse cx="42" cy="23" rx="2.2" ry="2.5" fill="#333" />
              <ellipse cx="50" cy="23" rx="2.2" ry="2.5" fill="#333" />
              <ellipse cx="42.6" cy="22.4" rx="0.7" ry="0.8" fill="#fff" />
              <ellipse cx="50.6" cy="22.4" rx="0.7" ry="0.8" fill="#fff" />
            </g>
          </g>

          {/* Nose */}
          <ellipse cx="46" cy="27" rx="1.5" ry="1" fill="#d4a373" />

          {/* Whiskers */}
          <g className={styles.whiskers} stroke="#a7a4a1" strokeWidth="0.7" strokeLinecap="round">
            <line x1="36" y1="25" x2="30" y2="24" />
            <line x1="36" y1="27" x2="30" y2="28" />
            <line x1="56" y1="25" x2="62" y2="24" />
            <line x1="56" y1="27" x2="62" y2="28" />
          </g>
        </g>

        {/* Front paws (visible in active state — stretching) */}
        <g className={styles.paws}>
          <ellipse cx="22" cy="54" rx="4" ry="2.8" fill="#ededed" />
          <ellipse cx="42" cy="54" rx="4" ry="2.8" fill="#ededed" />
        </g>
      </svg>
    </div>
  );
}
