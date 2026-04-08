import { useEffect, useRef } from "react";
import { getInactivityLogoutMs, INACTIVE_LOGOUT_SESSION_KEY } from "@/constants/inactivity";

export function useInactivityLogout(logout: () => Promise<void>, enabled: boolean) {
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const idleMs = getInactivityLogoutMs();
    const lastActivityRef = { current: Date.now() };
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const runLogout = () => {
      timerId = null;
      void (async () => {
        try {
          globalThis.sessionStorage?.setItem(INACTIVE_LOGOUT_SESSION_KEY, "1");
        } catch {
          /* ignore */
        }
        await logoutRef.current();
      })();
    };

    const schedule = () => {
      if (timerId !== null) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(runLogout, idleMs);
    };

    const bump = () => {
      lastActivityRef.current = Date.now();
      schedule();
    };

    const checkWallClock = () => {
      if (Date.now() - lastActivityRef.current >= idleMs) {
        if (timerId !== null) {
          clearTimeout(timerId);
          timerId = null;
        }
        runLogout();
      } else {
        schedule();
      }
    };

    bump();

    const evOpts: AddEventListenerOptions = { capture: true, passive: true };
    const onActivity = () => bump();
    const events = ["mousedown", "keydown", "touchstart", "click", "wheel"] as const;
    for (const e of events) {
      window.addEventListener(e, onActivity, evOpts);
    }
    document.addEventListener("scroll", onActivity, evOpts);

    let moveScheduled = false;
    const onMove = () => {
      if (moveScheduled) return;
      moveScheduled = true;
      requestAnimationFrame(() => {
        moveScheduled = false;
        bump();
      });
    };
    window.addEventListener("mousemove", onMove, { capture: true, passive: true });

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        checkWallClock();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onFocus = () => checkWallClock();
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("scroll", onActivity, evOpts);
      for (const e of events) {
        window.removeEventListener(e, onActivity, evOpts);
      }
      window.removeEventListener("mousemove", onMove, { capture: true } as AddEventListenerOptions);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      if (timerId !== null) {
        clearTimeout(timerId);
      }
    };
  }, [enabled]);
}
