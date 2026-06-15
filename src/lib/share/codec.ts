import {
  clampTension,
  TENSION_MIN,
  TENSION_MAX,
  type RacquetConfig,
  type Shape,
  type WeightClass,
  type Balance,
  type GripSetup,
} from "@/lib/domain/config";

const VERSION = "1";

const SHAPE_CODE: Record<Shape, string> = { teardrop: "t", traditional: "r", hybrid: "h" };
const WEIGHT_CODE: Record<WeightClass, string> = { light: "l", medium: "m", heavy: "y" };
const BALANCE_CODE: Record<Balance, string> = { headLight: "l", even: "e", headHeavy: "v" };
const GRIP_CODE: Record<GripSetup, string> = {
  stock: "s",
  thinOver: "t",
  thickOver: "k",
  tacky: "c",
};

const invert = <T extends string>(m: Record<T, string>) =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as Record<string, T>;

const SHAPE_FROM = invert(SHAPE_CODE);
const WEIGHT_FROM = invert(WEIGHT_CODE);
const BALANCE_FROM = invert(BALANCE_CODE);
const GRIP_FROM = invert(GRIP_CODE);

/** Versioned, delimited, URL-safe token: `1.<shape>.<weight>.<balance>.<grip>.<tension>`. */
export function encodeConfig(c: RacquetConfig): string {
  return [
    VERSION,
    SHAPE_CODE[c.shape],
    WEIGHT_CODE[c.weightClass],
    BALANCE_CODE[c.balance],
    GRIP_CODE[c.grip],
    String(clampTension(c.stringTensionLb)),
  ].join(".");
}

/** Parse a token back to a config, or null if anything is invalid. Never throws. */
export function decodeConfig(token: string | null | undefined): RacquetConfig | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 6) return null;
  const [v, s, w, b, g, tRaw] = parts;
  if (v !== VERSION) return null;

  const shape = SHAPE_FROM[s];
  const weightClass = WEIGHT_FROM[w];
  const balance = BALANCE_FROM[b];
  const grip = GRIP_FROM[g];
  if (!shape || !weightClass || !balance || !grip) return null;

  if (!/^\d{1,2}$/.test(tRaw)) return null;
  const stringTensionLb = Number(tRaw);
  if (stringTensionLb < TENSION_MIN || stringTensionLb > TENSION_MAX) return null;

  return { shape, weightClass, balance, grip, stringTensionLb };
}
