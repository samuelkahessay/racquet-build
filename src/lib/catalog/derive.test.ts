import { describe, expect, it } from "vitest";
import { deriveBalance, deriveConfig, deriveWeightClass, validateSpec } from "./derive";
import type { RacquetSpec } from "./types";

const baseSpec: RacquetSpec = {
  slug: "example-frame",
  brand: "Example",
  model: "Frame",
  status: "current",
  frameFamily: "teardrop",
  advertisedWeightG: 125,
  balanceMm: 350,
  headSizeCm2: 500,
  recommendedTensionLb: [24, 28],
  sources: [
    {
      type: "official",
      name: "Example",
      url: "https://example.com/frame",
      observedAt: "2026-06-15",
      confidence: "high",
    },
  ],
};

describe("catalog derivation", () => {
  it("maps measured specs into the simulator config buckets", () => {
    expect(deriveWeightClass(119)).toBe("light");
    expect(deriveWeightClass(120)).toBe("medium");
    expect(deriveWeightClass(141)).toBe("heavy");
    expect(deriveBalance(359)).toBe("headLight");
    expect(deriveBalance(360)).toBe("even");
    expect(deriveBalance(371)).toBe("headHeavy");

    expect(deriveConfig(baseSpec)).toEqual({
      shape: "teardrop",
      weightClass: "medium",
      balance: "headLight",
      stringTensionLb: 26,
      grip: "stock",
    });
  });

  it("flags malformed source-backed data", () => {
    expect(
      validateSpec({
        ...baseSpec,
        slug: "Bad Slug",
        advertisedWeightG: 250,
        sources: [{ ...baseSpec.sources[0], url: "http://example.com", observedAt: "June 15" }],
      }),
    ).toEqual([
      "Bad Slug: invalid slug",
      "Bad Slug: advertised weight out of expected squash range",
      "Bad Slug: source URL must be https",
      "Bad Slug: source observedAt must be YYYY-MM-DD",
    ]);
  });
});
