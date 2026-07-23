"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./cat-paw.module.scss";

interface Position {
  x: number;
  y: number;
}

export default function CatPaw() {
  const pawRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [swatting, setSwatting] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseRef = useRef<Position>({ x: 0, y: 0 });

  const swat = useCallback(() => {
    const { x, y } = mouseRef.current;
    const angle = (Math.random() - 0.5) * 180;

    setPosition({ x: x - 32, y: y - 32 });
    setRotation(angle);
    setVisible(true);

    requestAnimationFrame(() => {
      setSwatting(true);
      setTimeout(() => {
        setSwatting(false);
        setTimeout(() => setVisible(false), 300);
      }, 400);
    });
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) return;

    const handleMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const target = e.target as HTMLElement;
      // Game arenas (and similar) opt out so the swat paw doesn't fight the UI
      if (target.closest("[data-no-paw]")) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }
      if (target.closest("a, button, [data-paw-target]")) {
        timeoutRef.current = setTimeout(swat, 700);
      }
    };

    const handleLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseleave", handleLeave);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [swat]);

  if (!visible) return null;

  return (
    <div
      ref={pawRef}
      className={`${styles.paw} ${swatting ? styles.swat : ""}`}
      style={{
        left: position.x,
        top: position.y,
        transform: `rotate(${rotation}deg)`,
      }}
      aria-hidden="true"
    >
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="42" rx="12" ry="14" fill="#ededed" />
        <ellipse cx="20" cy="26" rx="6" ry="8" fill="#ededed" />
        <ellipse cx="32" cy="22" rx="6" ry="8" fill="#ededed" />
        <ellipse cx="44" cy="26" rx="6" ry="8" fill="#ededed" />
        <ellipse cx="32" cy="42" rx="8" ry="9" fill="#d4a373" opacity="0.6" />
        <ellipse cx="20" cy="26" rx="4" ry="5" fill="#d4a373" opacity="0.6" />
        <ellipse cx="32" cy="22" rx="4" ry="5" fill="#d4a373" opacity="0.6" />
        <ellipse cx="44" cy="26" rx="4" ry="5" fill="#d4a373" opacity="0.6" />
      </svg>
    </div>
  );
}
