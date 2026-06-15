import { scoreRaw } from "@/lib/scoring/score";
import { SCORE_AXES } from "@/lib/domain/score";
import type { EmphasisVector } from "@/lib/scoring/recommend";
import { RACQUET_SPECS } from "./data";
import { deriveConfig, deriveConfidence, validateSpec } from "./derive";
import type { CatalogRacquet, CatalogRecommendation } from "./types";

const EPS = 1e-9;

export type { CatalogRacquet, CatalogRecommendation } from "./types";

export const CATALOG: CatalogRacquet[] = RACQUET_SPECS.map((spec) => {
  const config = deriveConfig(spec);
  return {
    ...spec,
    config,
    scores: scoreRaw(config),
    confidence: deriveConfidence(spec),
  };
});

export function validateCatalog(): string[] {
  const errors = RACQUET_SPECS.flatMap(validateSpec);
  const seen = new Set<string>();
  for (const spec of RACQUET_SPECS) {
    if (seen.has(spec.slug)) errors.push(`${spec.slug}: duplicate slug`);
    seen.add(spec.slug);
  }
  return errors;
}

function sanitizeEmphasis(target: EmphasisVector): EmphasisVector {
  const out = {} as EmphasisVector;
  let sum = 0;
  for (const axis of SCORE_AXES) {
    const value = Number.isFinite(target[axis]) && target[axis] > 0 ? target[axis] : 0;
    out[axis] = value;
    sum += value;
  }
  if (sum === 0) {
    const uniform = 1 / SCORE_AXES.length;
    for (const axis of SCORE_AXES) out[axis] = uniform;
  } else {
    for (const axis of SCORE_AXES) out[axis] /= sum;
  }
  return out;
}

export function recommendCatalog(
  target: EmphasisVector,
  opts: { beginnerBias?: boolean; limit?: number } = {},
): CatalogRecommendation[] {
  const weights = sanitizeEmphasis(target);
  return CATALOG.map((racquet) => {
    let distance = 0;
    for (const axis of SCORE_AXES) {
      const have = racquet.scores[axis] / 100;
      distance += weights[axis] * (1 - have) * (1 - have);
    }
    return { racquet, distance };
  })
    .sort((a, b) => {
      if (Math.abs(a.distance - b.distance) > EPS) return a.distance - b.distance;
      if (opts.beginnerBias) {
        const aBeginner = a.racquet.scores.forgiveness + a.racquet.scores.comfort;
        const bBeginner = b.racquet.scores.forgiveness + b.racquet.scores.comfort;
        if (aBeginner !== bBeginner) return bBeginner - aBeginner;
      }
      return a.racquet.brand.localeCompare(b.racquet.brand) || a.racquet.model.localeCompare(b.racquet.model);
    })
    .slice(0, opts.limit ?? 3);
}
