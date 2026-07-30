"use client";

import { useEffect } from "react";

/**
 * Desktop convenience: press R to restart when an end-of-run overlay is up.
 * Ignored while modifiers are held or focus is in a text field.
 */
export function useRestartKey(active: boolean, onRestart: () => void) {
  useEffect(() => {
    if (!active) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyR" && e.key !== "r" && e.key !== "R" && e.key !== "к" && e.key !== "К") {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      e.preventDefault();
      onRestart();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onRestart]);
}
