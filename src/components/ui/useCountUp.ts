import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Animate an integer toward `target` with ease-out. Respects reduced-motion (snaps on
 * the first frame). State is only ever updated inside the rAF callback. Returns the
 * current displayed integer.
 */
export function useCountUp(target: number, durationMs = 420): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const duration = prefersReducedMotion() ? 0 : durationMs;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = target;
    };
  }, [target, durationMs]);

  return value;
}
