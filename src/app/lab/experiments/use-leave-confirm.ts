"use client";

import { useEffect } from "react";

const GUARD_STATE = { __labNavGuard: true } as const;

function hasGuardState(): boolean {
  const state = window.history.state as { __labNavGuard?: boolean } | null;
  return Boolean(state?.__labNavGuard);
}

/**
 * While playing: buffer one history entry and ask before leaving via back/swipe-back.
 * Stay keeps the run; Leave goes back. Buffer is dropped when the round ends.
 */
export function useLeaveConfirm(active: boolean, message: string) {
  useEffect(() => {
    if (!active) return;

    let allowExit = false;

    const onPopState = () => {
      if (allowExit) return;

      if (window.confirm(message)) {
        allowExit = true;
        window.history.back();
        return;
      }

      window.history.pushState(GUARD_STATE, "");
    };

    window.addEventListener("popstate", onPopState);

    if (!hasGuardState()) {
      window.history.pushState(GUARD_STATE, "");
    }

    return () => {
      allowExit = true;
      window.removeEventListener("popstate", onPopState);
      if (hasGuardState()) {
        window.history.back();
      }
    };
  }, [active, message]);
}
