import type { RacquetConfig } from "@/lib/domain/config";
import { TENSION_MIN, TENSION_MAX } from "@/lib/domain/config";

export type Pt = [number, number]; // centered coords, y-up

export interface RacquetGeometry {
  /** Closed frame centerline (head arc + throat rails). Stroke this with `beamWidth`. */
  frame: Pt[];
  /** Throat bridge/yoke line; null for full teardrop frames. */
  bridge: Pt[] | null;
  /** Filled grip wrap on the handle. */
  grip: { topY: number; buttY: number; halfW: number; accent: boolean };
  mains: Pt[][]; // vertical strings
  crosses: Pt[][]; // horizontal strings
  centerLine: Pt[]; // long construction axis
  balanceY: number; // y of the balance marker on the axis
  beamWidth: number; // frame beam thickness in geometry units
  stringBrightness: number; // 0..1
  /** Drawing extents (already symmetric in x) for the SVG viewBox. */
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

/**
 * World Squash caps full racket length at 686 mm, width at 215 mm, string length
 * at 390 mm, and strung area at 500 cm2. Geometry units here are roughly mm.
 */
interface ShapeSpec {
  topY: number;
  maxHalfW: number;
  // Right-side outline from the top tip to the throat/shaft.
  start: Pt;
  curves: { c1: Pt; c2: Pt; to: Pt }[];
  shaftHalf: number; // frame half-width where the rails meet the handle
  bridge: null | {
    kind: "straight" | "arch" | "yoke";
    sideY: number;
    centerY: number;
    halfW: number;
  };
}

const HANDLE_TOP_Y = 188; // shaft/handle junction — handle is ~188 below it to the butt
const BUTT_Y = 0;
const MAX_STRING_LENGTH = 390;

const SHAPE: Record<RacquetConfig["shape"], ShapeSpec> = {
  // Carboflex-like teardrop: long main strings descend into a narrow monoshaft.
  teardrop: {
    topY: 684,
    maxHalfW: 96,
    start: [0, 684],
    curves: [
      { c1: [24, 684], c2: [60, 672], to: [78, 640] },
      { c1: [94, 610], c2: [98, 560], to: [90, 512] },
      { c1: [82, 438], c2: [61, 354], to: [36, 284] },
      { c1: [23, 246], c2: [15, 210], to: [9, HANDLE_TOP_Y] },
    ],
    shaftHalf: 9,
    bridge: null,
  },
  // Classic bridged head: squarer/compact string bed, shorter mains, straight bridge.
  traditional: {
    topY: 670,
    maxHalfW: 102,
    start: [0, 670],
    curves: [
      { c1: [34, 672], c2: [84, 658], to: [98, 610] },
      { c1: [106, 572], c2: [105, 514], to: [95, 468] },
      { c1: [86, 418], c2: [66, 366], to: [50, 342] },
      { c1: [38, 318], c2: [22, 232], to: [14, HANDLE_TOP_Y] },
    ],
    shaftHalf: 14,
    bridge: { kind: "arch", sideY: 342, centerY: 330, halfW: 50 },
  },
  // Evolution-style hybrid: teardrop-ish outer frame with a small throat yoke/opening.
  hybrid: {
    topY: 680,
    maxHalfW: 98,
    start: [0, 680],
    curves: [
      { c1: [28, 681], c2: [66, 668], to: [84, 636] },
      { c1: [99, 604], c2: [99, 556], to: [90, 510] },
      { c1: [80, 444], c2: [64, 376], to: [42, 306] },
      { c1: [30, 258], c2: [17, 208], to: [11, HANDLE_TOP_Y] },
    ],
    shaftHalf: 11,
    bridge: { kind: "yoke", sideY: 304, centerY: 278, halfW: 36 },
  },
};

// heavier frames carry a visibly thicker beam (real beams run 16–21 mm)
const BEAM_WIDTH: Record<RacquetConfig["weightClass"], number> = {
  light: 6.5,
  medium: 8.5,
  heavy: 11.5,
};

// half-width of the grip wrap
const GRIP_HALF: Record<RacquetConfig["grip"], number> = {
  stock: 8.5,
  thinOver: 9.5,
  thickOver: 12.5,
  tacky: 10.5,
};

// balance point measured up from the butt (even ≈ 340 mm); marker rides the axis
const BALANCE_Y: Record<RacquetConfig["balance"], number> = {
  headLight: 300,
  even: 348,
  headHeavy: 404,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function sampleCubic(start: Pt, curves: ShapeSpec["curves"], samplesPerSegment = 14): Pt[] {
  const out: Pt[] = [start];
  let from = start;
  for (const { c1, c2, to } of curves) {
    for (let j = 1; j <= samplesPerSegment; j++) {
      const t = j / samplesPerSegment;
      const u = 1 - t;
      out.push([
        u ** 3 * from[0] + 3 * u ** 2 * t * c1[0] + 3 * u * t ** 2 * c2[0] + t ** 3 * to[0],
        u ** 3 * from[1] + 3 * u ** 2 * t * c1[1] + 3 * u * t ** 2 * c2[1] + t ** 3 * to[1],
      ]);
    }
    from = to;
  }
  return out;
}

function sampleBridge(bridge: NonNullable<ShapeSpec["bridge"]>): Pt[] {
  if (bridge.kind === "straight") {
    return [
      [-bridge.halfW, bridge.sideY],
      [bridge.halfW, bridge.sideY],
    ];
  }

  const pts: Pt[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const x = lerp(-bridge.halfW, bridge.halfW, t);
    const ax = Math.abs(x) / bridge.halfW;
    const y = bridge.centerY + (bridge.sideY - bridge.centerY) * ax * ax;
    pts.push([x, y]);
  }
  return pts;
}

export function buildRacquetGeometry(config: RacquetConfig): RacquetGeometry {
  const s = SHAPE[config.shape];

  // Right half of the frame, top tip -> shaft, sampled from real-racket curve segments.
  const right = sampleCubic(s.start, s.curves);

  // closed frame loop: right side down, then mirrored left side back up
  const left = right.map(([x, y]) => [-x, y] as Pt).reverse();
  const frame: Pt[] = [...right, ...left];

  const bridge: Pt[] | null = s.bridge ? sampleBridge(s.bridge) : null;

  const halfWidthAtY = (y: number): number => {
    const hits: number[] = [];
    for (let i = 0; i < right.length - 1; i++) {
      const a = right[i];
      const b = right[i + 1];
      if ((y <= a[1] && y >= b[1]) || (y >= a[1] && y <= b[1])) {
        const dy = b[1] - a[1];
        const t = Math.abs(dy) < 0.001 ? 0 : (y - a[1]) / dy;
        hits.push(lerp(a[0], b[0], clamp01(t)));
      }
    }
    return hits.length === 0 ? 0 : Math.max(...hits);
  };

  // ---- string bed -------------------------------------------------------
  const t01 = clamp01((config.stringTensionLb - TENSION_MIN) / (TENSION_MAX - TENSION_MIN));
  const nMains = Math.round(lerp(11, 15, t01));
  const nCrosses = Math.round(lerp(13, 19, t01));
  const stringBrightness = lerp(0.4, 1, t01);

  const inset = BEAM_WIDTH[config.weightClass] * 0.62 + 3;
  const innerHalfWidthAtY = (y: number): number => Math.max(0, halfWidthAtY(y) - inset);
  const stringTopY = s.topY - 22;
  const openBottomY = Math.max(HANDLE_TOP_Y + 9, stringTopY - MAX_STRING_LENGTH);

  const bridgeLimitAtX = (x: number): number | null => {
    if (!s.bridge) return null;
    const ax = Math.abs(x);
    if (ax > s.bridge.halfW) return s.bridge.sideY;
    if (s.bridge.kind === "straight") return s.bridge.sideY + 5;
    const t = ax / s.bridge.halfW;
    return s.bridge.centerY + (s.bridge.sideY - s.bridge.centerY) * t * t + 5;
  };

  const stringFloor = (x: number): number => {
    const bridgeLimit = bridgeLimitAtX(x);
    if (bridgeLimit !== null) return bridgeLimit;
    const ax = Math.abs(x);
    for (let y = openBottomY; y <= stringTopY; y += 2) {
      if (innerHalfWidthAtY(y) >= ax) return y;
    }
    return openBottomY;
  };

  const mains: Pt[][] = [];
  const mainHalfW = s.bridge ? s.bridge.halfW * 0.88 : s.maxHalfW * 0.72;
  for (let i = 0; i < nMains; i++) {
    const x = lerp(-mainHalfW, mainHalfW, nMains === 1 ? 0.5 : i / (nMains - 1));
    let top = stringTopY;
    for (let y = stringTopY; y >= openBottomY; y -= 2) {
      if (innerHalfWidthAtY(y) >= Math.abs(x)) {
        top = y;
        break;
      }
    }
    const bottom = stringFloor(Math.abs(x));
    if (top - bottom < 8) continue;
    mains.push([
      [x, top],
      [x, bottom],
    ]);
  }

  // crosses span the frame at the local inner width; teardrops continue lower.
  const crosses: Pt[][] = [];
  const yTop = stringTopY;
  const yBottom = s.bridge ? Math.max(s.bridge.centerY, s.bridge.sideY) + 10 : openBottomY + 2;
  for (let i = 0; i < nCrosses; i++) {
    const y = lerp(yBottom, yTop, nCrosses === 1 ? 0.5 : i / (nCrosses - 1));
    let halfW = innerHalfWidthAtY(y) * 0.92;
    if (s.bridge && y <= s.bridge.sideY + 20) halfW = Math.min(halfW, s.bridge.halfW * 0.9);
    halfW *= 0.97;
    if (halfW < 4) continue;
    crosses.push([
      [-halfW, y],
      [halfW, y],
    ]);
  }

  const beamWidth = BEAM_WIDTH[config.weightClass];
  const xExtent = s.maxHalfW + beamWidth / 2 + 6;

  return {
    frame,
    bridge,
    grip: {
      topY: HANDLE_TOP_Y + 8,
      buttY: BUTT_Y,
      halfW: GRIP_HALF[config.grip],
      accent: config.grip === "tacky",
    },
    mains,
    crosses,
    centerLine: [
      [0, s.topY + 10],
      [0, BUTT_Y - 10],
    ],
    balanceY: BALANCE_Y[config.balance],
    beamWidth,
    stringBrightness,
    bounds: {
      minX: -xExtent,
      maxX: xExtent,
      minY: BUTT_Y - 12,
      maxY: s.topY + 12,
    },
  };
}
