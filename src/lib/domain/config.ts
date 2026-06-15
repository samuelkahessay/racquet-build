export type Shape = "teardrop" | "traditional" | "hybrid";
export type WeightClass = "light" | "medium" | "heavy";
export type Balance = "headLight" | "even" | "headHeavy";
export type GripSetup = "stock" | "thinOver" | "thickOver" | "tacky";

export interface RacquetConfig {
  shape: Shape;
  weightClass: WeightClass;
  balance: Balance;
  stringTensionLb: number; // integer lb within [TENSION_MIN, TENSION_MAX]
  grip: GripSetup;
}

export const TENSION_MIN = 18;
export const TENSION_MAX = 32;
export const TENSION_PIVOT = 26;

export const SHAPES: Shape[] = ["teardrop", "traditional", "hybrid"];
export const WEIGHT_CLASSES: WeightClass[] = ["light", "medium", "heavy"];
export const BALANCES: Balance[] = ["headLight", "even", "headHeavy"];
export const GRIPS: GripSetup[] = ["stock", "thinOver", "thickOver", "tacky"];

export const DEFAULT_CONFIG: RacquetConfig = {
  shape: "hybrid",
  weightClass: "medium",
  balance: "even",
  stringTensionLb: 26,
  grip: "stock",
};

export function clampTension(lb: number): number {
  return Math.max(TENSION_MIN, Math.min(TENSION_MAX, Math.round(lb)));
}
