import type { RacquetConfig } from "@/lib/domain/config";
import { TENSION_MIN, TENSION_MAX } from "@/lib/domain/config";

export type Pt = [number, number]; // centered coords, y-up

export interface RacquetGeometry {
  /** Closed frame centerline (head arc + throat rails). Stroke this with `beamWidth`. */
  frame: Pt[];
  /** Closed-throat bridge line (traditional only); null for open-throat frames. */
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
 * Real squash proportions drive these numbers (overall ~686 mm long, head a long
 * narrow oval, a long throat, ~180 mm handle). Geometry units are roughly mm.
 */
interface ShapeSpec {
  headHalfW: number; // max half-width of the head
  headCy: number; // ellipse centre y
  headHH: number; // ellipse half-height (head is tall + narrow)
  lowerTaper: number; // 0..1 — how much the lower head pinches toward the throat
  junction: number; // angle from the top (×π) where the head hands off to the rails
  shaftHalf: number; // frame half-width where the rails meet the handle
  closed: boolean; // closed (bridged) throat vs. open teardrop
}

const HANDLE_TOP_Y = 188; // shaft/handle junction — handle is ~188 below it to the butt
const BUTT_Y = 0;

const SHAPE: Record<RacquetConfig["shape"], ShapeSpec> = {
  // open throat, strings run deep into a long teardrop
  teardrop: { headHalfW: 86, headCy: 486, headHH: 200, lowerTaper: 0.26, junction: 0.66, shaftHalf: 9, closed: false },
  // rounder head closed by a bridge, shorter throat
  traditional: { headHalfW: 93, headCy: 470, headHH: 178, lowerTaper: 0.6, junction: 0.78, shaftHalf: 12, closed: true },
  // a balanced blend of the two
  hybrid: { headHalfW: 89, headCy: 480, headHH: 192, lowerTaper: 0.42, junction: 0.71, shaftHalf: 11, closed: false },
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

/** Head ellipse point at angle `phi` (0 = top tip, increasing toward the throat). */
function headPoint(s: ShapeSpec, phi: number): Pt {
  const cos = Math.cos(phi);
  const taper = cos < 0 ? lerp(1, s.lowerTaper, -cos) : 1; // pinch the lower half
  const x = s.headHalfW * Math.sin(phi) * taper;
  const y = s.headCy + s.headHH * cos;
  return [x, y];
}

/** Quadratic-bezier throat rail from the head flank `a` down to the shaft `b`. */
function rail(a: Pt, b: Pt, seg = 12): Pt[] {
  // control point pulls the rail into a gentle concave sweep
  const c: Pt = [b[0] + (a[0] - b[0]) * 0.22, a[1] * 0.42 + b[1] * 0.58];
  const out: Pt[] = [];
  for (let i = 1; i <= seg; i++) {
    const t = i / seg;
    const u = 1 - t;
    out.push([
      u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
    ]);
  }
  return out;
}

export function buildRacquetGeometry(config: RacquetConfig): RacquetGeometry {
  const s = SHAPE[config.shape];
  const junctionPhi = Math.PI * s.junction;

  // right half of the frame, top tip -> shaft (head arc, then throat rail)
  const SEG = 60;
  const headTopY = s.headCy + s.headHH;
  const right: Pt[] = [];
  for (let i = 0; i <= SEG; i++) {
    const phi = junctionPhi * (i / SEG);
    right.push(headPoint(s, phi));
  }
  const flank = right[right.length - 1];
  right.push(...rail(flank, [s.shaftHalf, HANDLE_TOP_Y]));

  // closed frame loop: right side down, then mirrored left side back up
  const left = right.map(([x, y]) => [-x, y] as Pt).reverse();
  const frame: Pt[] = [...right, ...left];

  // closed throat: a bridge spanning the lower head
  const bridgeY = s.headCy - s.headHH * 0.62;
  const bridge: Pt[] | null = s.closed
    ? [
        [-s.headHalfW * 0.42, bridgeY],
        [s.headHalfW * 0.42, bridgeY],
      ]
    : null;

  // ---- string bed -------------------------------------------------------
  const t01 = clamp01((config.stringTensionLb - TENSION_MIN) / (TENSION_MAX - TENSION_MIN));
  const nMains = Math.round(lerp(7, 13, t01));
  const nCrosses = Math.round(lerp(9, 16, t01));
  const stringBrightness = lerp(0.4, 1, t01);

  const wBed = s.headHalfW * 0.9; // inset from the beam
  const hBed = s.headHH * 0.9;
  const flankX = Math.abs(flank[0]);
  const flankY = flank[1];
  const bedFloor = s.closed ? bridgeY : HANDLE_TOP_Y + 6; // open throats string to the shaft

  // lowest y a vertical string at |x| can reach before exiting the frame
  const stringFloor = (ax: number): number => {
    if (s.closed) return bridgeY;
    if (ax <= s.shaftHalf) return bedFloor;
    if (ax <= flankX) return lerp(flankY, bedFloor, (flankX - ax) / (flankX - s.shaftHalf));
    return s.headCy - hBed * Math.sqrt(Math.max(0, 1 - (ax / wBed) ** 2));
  };

  const mains: Pt[][] = [];
  for (let i = 0; i < nMains; i++) {
    const x = lerp(-wBed, wBed, nMains === 1 ? 0.5 : i / (nMains - 1)) * 0.97;
    const r = 1 - (x / wBed) ** 2;
    if (r <= 0) continue;
    const top = s.headCy + hBed * Math.sqrt(r);
    const bottom = stringFloor(Math.abs(x));
    if (top - bottom < 8) continue;
    mains.push([
      [x, top],
      [x, bottom],
    ]);
  }

  // crosses span the head and, for open throats, continue down the teardrop
  const crosses: Pt[][] = [];
  const yTop = s.headCy + hBed;
  const yBottom = s.closed ? bridgeY + 4 : HANDLE_TOP_Y + 10;
  for (let i = 0; i < nCrosses; i++) {
    const y = lerp(yBottom, yTop, nCrosses === 1 ? 0.5 : i / (nCrosses - 1));
    let halfW: number;
    if (y >= s.headCy - hBed) {
      const rel = (y - s.headCy) / hBed;
      halfW = wBed * Math.sqrt(Math.max(0, 1 - rel * rel));
    } else {
      // throat region: interpolate the rail half-width
      halfW = lerp(s.shaftHalf, flankX, clamp01((y - HANDLE_TOP_Y) / (flankY - HANDLE_TOP_Y)));
    }
    halfW *= 0.97;
    if (halfW < 4) continue;
    crosses.push([
      [-halfW, y],
      [halfW, y],
    ]);
  }

  const beamWidth = BEAM_WIDTH[config.weightClass];
  const xExtent = s.headHalfW + beamWidth / 2 + 6;

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
      [0, headTopY + 10],
      [0, BUTT_Y - 10],
    ],
    balanceY: BALANCE_Y[config.balance],
    beamWidth,
    stringBrightness,
    bounds: {
      minX: -xExtent,
      maxX: xExtent,
      minY: BUTT_Y - 12,
      maxY: headTopY + 12,
    },
  };
}
