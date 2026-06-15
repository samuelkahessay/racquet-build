"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import type { Group } from "three";
import type { RacquetConfig } from "@/lib/domain/config";
import { buildRacquetGeometry, type Pt } from "./racquetGeometry";

const S = 0.02; // 2D geometry units -> 3D world units
const INK = "#c7daf4";
const INK_FAINT = "#84a8d6";
const ACCENT = "#ff6a43";

const to3 = (p: Pt): [number, number, number] => [p[0] * S, p[1] * S, 0];
const line3 = (pts: Pt[]) => pts.map(to3);

function circle(cx: number, cy: number, r: number, seg = 36): [number, number, number][] {
  return Array.from({ length: seg + 1 }, (_, i) => {
    const a = (Math.PI * 2 * i) / seg;
    return [(cx + r * Math.cos(a)) * S, (cy + r * Math.sin(a)) * S, 0] as [number, number, number];
  });
}

function Drawing({ config, reducedMotion }: { config: RacquetConfig; reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const g = useMemo(() => buildRacquetGeometry(config), [config]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    if (reducedMotion || (typeof document !== "undefined" && document.hidden)) return;
    const t = clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.45) * 0.32;
    group.current.rotation.x = -0.08 + Math.sin(t * 0.3) * 0.04;
  });

  return (
    <group ref={group}>
      {/* construction axis */}
      <Line points={line3(g.centerLine)} color={INK_FAINT} lineWidth={0.6} transparent opacity={0.4} dashed dashSize={0.08} gapSize={0.08} />

      {/* string bed */}
      {g.mains.map((l, i) => (
        <Line key={`m${i}`} points={line3(l)} color={INK} lineWidth={0.7} transparent opacity={g.stringBrightness * 0.85} />
      ))}
      {g.crosses.map((l, i) => (
        <Line key={`c${i}`} points={line3(l)} color={INK} lineWidth={0.7} transparent opacity={g.stringBrightness * 0.85} />
      ))}

      {/* frame */}
      <Line points={line3(g.headOutline)} color={INK} lineWidth={2} />
      {g.bridge && <Line points={line3(g.bridge)} color={INK} lineWidth={1.4} />}
      <Line points={line3(g.throat[0])} color={INK} lineWidth={2} />
      <Line points={line3(g.throat[1])} color={INK} lineWidth={2} />
      <Line points={line3(g.handle)} color={INK} lineWidth={2} />

      {/* balance marker */}
      <Line points={circle(0, g.balanceY, 5)} color={ACCENT} lineWidth={1.6} />
      <Line
        points={[
          [-10 * S, g.balanceY * S, 0],
          [10 * S, g.balanceY * S, 0],
        ]}
        color={ACCENT}
        lineWidth={1.4}
      />
    </group>
  );
}

export default function RacquetBlueprintCanvas({
  config,
  reducedMotion,
}: {
  config: RacquetConfig;
  reducedMotion: boolean;
}) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 10], zoom: 105, near: 0.1, far: 100 }}
      dpr={[1, 1.6]}
      frameloop="always"
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <Drawing config={config} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
