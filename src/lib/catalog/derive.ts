import {
  TENSION_MAX,
  TENSION_MIN,
  TENSION_PIVOT,
  clampTension,
  type Balance,
  type RacquetConfig,
  type Shape,
  type WeightClass,
} from "@/lib/domain/config";
import type { CatalogConfidence, RacquetSpec } from "./types";

export function deriveWeightClass(weightG: number): WeightClass {
  if (weightG < 120) return "light";
  if (weightG <= 140) return "medium";
  return "heavy";
}

export function deriveBalance(balanceMm: number | undefined): Balance {
  if (balanceMm === undefined) return "even";
  if (balanceMm < 360) return "headLight";
  if (balanceMm <= 370) return "even";
  return "headHeavy";
}

export function deriveShape(frameFamily: RacquetSpec["frameFamily"]): Shape {
  return frameFamily;
}

export function deriveDefaultTension(range: RacquetSpec["recommendedTensionLb"]): number {
  if (!range) return TENSION_PIVOT;
  const [min, max] = range;
  return clampTension((min + max) / 2);
}

export function deriveConfig(spec: RacquetSpec): RacquetConfig {
  return {
    shape: deriveShape(spec.frameFamily),
    weightClass: deriveWeightClass(spec.strungWeightG ?? spec.advertisedWeightG),
    balance: deriveBalance(spec.balanceMm),
    stringTensionLb: deriveDefaultTension(spec.recommendedTensionLb),
    grip: "stock",
  };
}

export function deriveConfidence(spec: RacquetSpec): CatalogConfidence {
  if (spec.sources.some((source) => source.confidence === "low")) return "low";
  if (spec.balanceMm === undefined || spec.headSizeCm2 === undefined) return "medium";
  if (!spec.sources.some((source) => source.type === "official")) return "medium";
  return "high";
}

export function validateSpec(spec: RacquetSpec): string[] {
  const errors: string[] = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.slug)) errors.push(`${spec.slug}: invalid slug`);
  if (spec.advertisedWeightG < 90 || spec.advertisedWeightG > 170) {
    errors.push(`${spec.slug}: advertised weight out of expected squash range`);
  }
  if (spec.strungWeightG !== undefined && (spec.strungWeightG < 100 || spec.strungWeightG > 190)) {
    errors.push(`${spec.slug}: strung weight out of expected squash range`);
  }
  if (spec.balanceMm !== undefined && (spec.balanceMm < 320 || spec.balanceMm > 400)) {
    errors.push(`${spec.slug}: balance out of expected squash range`);
  }
  if (spec.headSizeCm2 !== undefined && (spec.headSizeCm2 < 450 || spec.headSizeCm2 > 525)) {
    errors.push(`${spec.slug}: head size out of expected squash range`);
  }
  if (spec.recommendedTensionLb) {
    const [min, max] = spec.recommendedTensionLb;
    if (min > max || min < TENSION_MIN || max > TENSION_MAX) {
      errors.push(`${spec.slug}: recommended tension outside app range`);
    }
  }
  if (spec.sources.length === 0) errors.push(`${spec.slug}: missing source`);
  for (const source of spec.sources) {
    if (!source.url.startsWith("https://")) errors.push(`${spec.slug}: source URL must be https`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.observedAt)) {
      errors.push(`${spec.slug}: source observedAt must be YYYY-MM-DD`);
    }
  }
  return errors;
}
