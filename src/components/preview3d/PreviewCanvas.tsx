"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { RacquetConfig } from "@/lib/domain/config";
import { StaticBlueprint } from "./StaticBlueprint";

// Heavy three/R3F bundle is code-split and never server-rendered.
const RacquetBlueprintCanvas = dynamic(() => import("./RacquetBlueprint"), {
  ssr: false,
});

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return (
      !!window.WebGLRenderingContext &&
      !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function PreviewCanvas({ config }: { config: RacquetConfig }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [webgl, setWebgl] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setWebgl(hasWebGL());
    setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Reduced-motion or no WebGL -> the static SVG (same geometry).
  const use3D = webgl && !reduced && inView;

  return (
    <div ref={ref} className="absolute inset-0">
      {use3D ? (
        <RacquetBlueprintCanvas config={config} reducedMotion={reduced} />
      ) : (
        <StaticBlueprint config={config} />
      )}
    </div>
  );
}
