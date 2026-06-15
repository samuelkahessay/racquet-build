import type { Shape, WeightClass, Balance, GripSetup } from "./config";
import type { ScoreAxis } from "./score";

export const SHAPE_LABELS: Record<Shape, string> = {
  teardrop: "Teardrop",
  traditional: "Traditional",
  hybrid: "Hybrid",
};
export const SHAPE_HINTS: Record<Shape, string> = {
  teardrop: "Open throat · larger sweet spot",
  traditional: "Closed bridge · more feel",
  hybrid: "Balanced blend · neutral",
};

export const WEIGHT_LABELS: Record<WeightClass, string> = {
  light: "Light",
  medium: "Medium",
  heavy: "Heavy",
};
export const WEIGHT_RANGE: Record<WeightClass, string> = {
  light: "105–120 g",
  medium: "120–140 g",
  heavy: "140–170 g",
};

export const BALANCE_LABELS: Record<Balance, string> = {
  headLight: "Head-light",
  even: "Even",
  headHeavy: "Head-heavy",
};
export const BALANCE_RANGE: Record<Balance, string> = {
  headLight: "< 360 mm",
  even: "360–370 mm",
  headHeavy: "> 370 mm",
};

export const GRIP_LABELS: Record<GripSetup, string> = {
  stock: "Stock",
  thinOver: "Thin over",
  thickOver: "Thick over",
  tacky: "Tacky",
};
export const GRIP_HINTS: Record<GripSetup, string> = {
  stock: "Replacement grip",
  thinOver: "Thin overgrip",
  thickOver: "Cushioned overgrip",
  tacky: "Sweat / tack focus",
};

export const AXIS_LABELS: Record<ScoreAxis, string> = {
  power: "Power",
  control: "Control",
  maneuverability: "Maneuverability",
  forgiveness: "Forgiveness",
  comfort: "Comfort",
};

/** Short labels for the radar plot vertices. */
export const AXIS_SHORT: Record<ScoreAxis, string> = {
  power: "PWR",
  control: "CTL",
  maneuverability: "MNV",
  forgiveness: "FGV",
  comfort: "CMF",
};
