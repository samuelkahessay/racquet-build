import type { RacquetConfig } from "@/lib/domain/config";
import { TENSION_MIN, TENSION_MAX } from "@/lib/domain/config";

export type Pt = [number, number]; // centered coords, y-up

export interface RacquetGeometry {
  headOutline: Pt[]; // closed polyline (first point repeated at end)
  bridge: Pt[] | null; // throat bridge line for closed-throat shapes
  throat: [Pt[], Pt[]]; // two converging throat lines
  handle: Pt[]; // closed rectangle polyline
  mains: Pt[][]; // vertical strings
  crosses: Pt[][]; // horizontal strings
  centerLine: Pt[]; // long construction axis
  balanceY: number; // y of the balance marker on the axis
  stringBrightness: number; // 0..1
  gripAccent: boolean; // tacky grip -> accent hue
  bounds: { halfW: number; halfH: number };
}

interface ShapeSpec {
  headTopY: number;
  headBottomY: number;
  width: number;
  taperBottom: number; // 0..1, lower = narrower throat
  bridge: boolean;
}

const SHAPE: Record<RacquetConfig["shape"], ShapeSpec> = {
  teardrop: { headTopY: 122, headBottomY: 16, width: 44, taperBottom: 0.4, bridge: false },
  traditional: { headTopY: 112, headBottomY: 30, width: 50, taperBottom: 0.72, bridge: true },
  hybrid: { headTopY: 117, headBottomY: 23, width: 47, taperBottom: 0.55, bridge: false },
};

const GRIP_WIDTH: Record<RacquetConfig["grip"], number> = {
  stock: 7,
  thinOver: 8,
  thickOver: 11,
  tacky: 9,
};

const BALANCE_Y: Record<RacquetConfig["balance"], number> = {
  headLight: -46,
  even: -8,
  headHeavy: 30,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function buildRacquetGeometry(config: RacquetConfig): RacquetGeometry {
  const s = SHAPE[config.shape];
  const headCy = (s.headTopY + s.headBottomY) / 2;
  const headH = s.headTopY - s.headBottomY;

  // head outline — ellipse with a tapered (teardrop) lower half
  const SEG = 96;
  const headOutline: Pt[] = [];
  for (let i = 0; i <= SEG; i++) {
    const phi = (Math.PI * 2 * i) / SEG; // 0 at top, increases clockwise
    const cos = Math.cos(phi);
    const taper = cos < 0 ? lerp(1, s.taperBottom, -cos) : 1;
    const x = (s.width / 2) * Math.sin(phi) * taper;
    const y = headCy + (headH / 2) * cos;
    headOutline.push([x, y]);
  }
  // close the loop exactly (avoid float drift at sin(2π))
  headOutline[headOutline.length - 1] = [...headOutline[0]];

  // throat: from the lower flanks of the head down to the shaft top
  const flankPhi = Math.PI * 0.78;
  const flankX = (s.width / 2) * Math.sin(flankPhi) * lerp(1, s.taperBottom, -Math.cos(flankPhi));
  const flankY = headCy + (headH / 2) * Math.cos(flankPhi);
  const shaftTopY = s.headBottomY - 14;
  const gripW = GRIP_WIDTH[config.grip];
  const throat: [Pt[], Pt[]] = [
    [
      [-flankX, flankY],
      [-gripW / 2, shaftTopY],
    ],
    [
      [flankX, flankY],
      [gripW / 2, shaftTopY],
    ],
  ];

  const bridge: Pt[] | null = s.bridge
    ? [
        [-s.width * 0.3, s.headBottomY + 6],
        [s.width * 0.3, s.headBottomY + 6],
      ]
    : null;

  // handle rectangle
  const handleBottomY = -124;
  const handle: Pt[] = [
    [-gripW / 2, shaftTopY],
    [gripW / 2, shaftTopY],
    [gripW / 2, handleBottomY],
    [-gripW / 2, handleBottomY],
    [-gripW / 2, shaftTopY],
  ];

  // string bed — clipped to an inner ellipse
  const t01 = clamp01((config.stringTensionLb - TENSION_MIN) / (TENSION_MAX - TENSION_MIN));
  const nMains = Math.round(lerp(6, 12, t01));
  const nCrosses = Math.round(lerp(6, 12, t01));
  const stringBrightness = lerp(0.45, 1, t01);
  const wS = s.width * 0.4;
  const hS = (headH / 2) * 0.86;

  const mains: Pt[][] = [];
  for (let i = 0; i < nMains; i++) {
    const x = lerp(-wS, wS, nMains === 1 ? 0.5 : i / (nMains - 1)) * 0.94;
    const r = 1 - (x / wS) * (x / wS);
    if (r <= 0) continue;
    const dy = hS * Math.sqrt(r);
    mains.push([
      [x, headCy - dy],
      [x, headCy + dy],
    ]);
  }
  const crosses: Pt[][] = [];
  for (let i = 0; i < nCrosses; i++) {
    const y = lerp(headCy - hS, headCy + hS, nCrosses === 1 ? 0.5 : i / (nCrosses - 1));
    const rel = (y - headCy) / hS;
    const r = 1 - rel * rel;
    if (r <= 0) continue;
    const dx = wS * Math.sqrt(r) * 0.94;
    crosses.push([
      [-dx, y],
      [dx, y],
    ]);
  }

  return {
    headOutline,
    bridge,
    throat,
    handle,
    mains,
    crosses,
    centerLine: [
      [0, s.headTopY + 12],
      [0, handleBottomY - 8],
    ],
    balanceY: BALANCE_Y[config.balance],
    stringBrightness,
    gripAccent: config.grip === "tacky",
    bounds: { halfW: 72, halfH: 150 },
  };
}
