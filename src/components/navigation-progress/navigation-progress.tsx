"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import styles from "./navigation-progress.module.scss";

export default function NavigationProgress() {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(false);

  const start = useCallback(() => {
    const bar = barRef.current;
    if (!bar || activeRef.current) return;
    activeRef.current = true;
    bar.classList.remove(styles.done);
    bar.classList.add(styles.active);
  }, []);

  const done = useCallback(() => {
    const bar = barRef.current;
    if (!bar || !activeRef.current) return;
    activeRef.current = false;
    bar.classList.remove(styles.active);
    bar.classList.add(styles.done);
  }, []);

  useEffect(() => {
    done();
  }, [pathname, done]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) return;
      if (anchor.target === "_blank") return;
      if (href === pathname) return;

      start();
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, start]);

  return <div ref={barRef} className={styles.bar} />;
}
