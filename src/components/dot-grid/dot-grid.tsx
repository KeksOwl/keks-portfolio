"use client";

import { useEffect, useRef } from "react";
import styles from "./dot-grid.module.scss";

interface Dot {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const DOT_SPACING = 36;
const DOT_RADIUS = 1;
const MOUSE_RADIUS = 100;
const PUSH_FORCE = 0.5;
const RETURN_SPEED = 0.04;
const DAMPING = 0.92;
const REST_THRESHOLD = 0.01;
const STATIC_COLOR = "rgba(225, 172, 110, 0.15)";

export default function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const dotsRef = useRef<Dot[]>([]);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(pointer: coarse)").matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const rect = canvas!.parentElement!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      initDots(w, h);
      drawStatic();
    }

    function initDots(w: number, h: number) {
      const dots: Dot[] = [];
      const cols = Math.ceil(w / DOT_SPACING);
      const rows = Math.ceil(h / DOT_SPACING);
      const offsetX = (w - (cols - 1) * DOT_SPACING) / 2;
      const offsetY = (h - (rows - 1) * DOT_SPACING) / 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = offsetX + col * DOT_SPACING;
          const y = offsetY + row * DOT_SPACING;
          dots.push({ originX: x, originY: y, x, y, vx: 0, vy: 0 });
        }
      }
      dotsRef.current = dots;
    }

    function drawStatic() {
      ctx!.clearRect(0, 0, w, h);
      for (const dot of dotsRef.current) {
        ctx!.beginPath();
        ctx!.arc(dot.originX, dot.originY, DOT_RADIUS, 0, Math.PI * 2);
        ctx!.fillStyle = STATIC_COLOR;
        ctx!.fill();
      }
    }

    function wake() {
      if (runningRef.current) return;
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(animate);
    }

    function animate() {
      ctx!.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      let allAtRest = true;

      for (const dot of dotsRef.current) {
        const dx = dot.x - mx;
        const dy = dot.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_RADIUS) {
          const force = (1 - dist / MOUSE_RADIUS) * PUSH_FORCE;
          const angle = Math.atan2(dy, dx);
          dot.vx += Math.cos(angle) * force;
          dot.vy += Math.sin(angle) * force;
        }

        const sx = (dot.originX - dot.x) * RETURN_SPEED;
        const sy = (dot.originY - dot.y) * RETURN_SPEED;
        dot.vx = (dot.vx + sx) * DAMPING;
        dot.vy = (dot.vy + sy) * DAMPING;
        dot.x += dot.vx;
        dot.y += dot.vy;

        const displacement = Math.sqrt(
          (dot.x - dot.originX) ** 2 + (dot.y - dot.originY) ** 2
        );

        if (displacement > REST_THRESHOLD || Math.abs(dot.vx) > REST_THRESHOLD || Math.abs(dot.vy) > REST_THRESHOLD) {
          allAtRest = false;
        }

        const alpha = Math.min(0.15 + displacement * 0.015, 0.5);
        ctx!.beginPath();
        ctx!.arc(dot.x, dot.y, DOT_RADIUS + displacement * 0.01, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(225, 172, 110, ${alpha})`;
        ctx!.fill();
      }

      if (allAtRest && mouseRef.current.x === -9999) {
        runningRef.current = false;
        drawStatic();
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    function handleMouse(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      wake();
    }

    function handleLeave() {
      mouseRef.current = { x: -9999, y: -9999 };
    }

    resize();

    if (prefersReduced || isMobile) {
      return;
    }

    document.addEventListener("mousemove", handleMouse);
    document.addEventListener("mouseleave", handleLeave);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", handleMouse);
      document.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </div>
  );
}
