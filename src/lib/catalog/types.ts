import type { RacquetConfig } from "@/lib/domain/config";
import type { ScoreVector } from "@/lib/domain/score";

export type CatalogSourceType = "official" | "retailer" | "review" | "measured";
export type CatalogConfidence = "high" | "medium" | "low";

export interface CatalogSource {
  type: CatalogSourceType;
  name: string;
  url: string;
  observedAt: string;
  confidence: CatalogConfidence;
  notes?: string;
}

export interface RacquetSpec {
  slug: string;
  brand: string;
  model: string;
  modelYear?: number;
  status: "current" | "recent" | "archived";
  frameFamily: "teardrop" | "traditional" | "hybrid";
  advertisedWeightG: number;
  strungWeightG?: number;
  balanceMm?: number;
  headSizeCm2?: number;
  lengthMm?: number;
  stringPattern?: string;
  recommendedTensionLb?: [number, number];
  factoryString?: string;
  imageUrl?: string;
  sources: CatalogSource[];
}

export interface CatalogRacquet extends RacquetSpec {
  config: RacquetConfig;
  scores: ScoreVector;
  confidence: CatalogConfidence;
}

export interface CatalogRecommendation {
  racquet: CatalogRacquet;
  distance: number;
}
