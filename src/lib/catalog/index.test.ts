import { describe, expect, it } from "vitest";
import { SCORE_AXES } from "@/lib/domain/score";
import { CATALOG, recommendCatalog, validateCatalog } from "./index";

describe("catalog", () => {
  it("has valid source-backed seed entries", () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(8);
    expect(validateCatalog()).toEqual([]);
    for (const racquet of CATALOG) {
      expect(racquet.config.grip).toBe("stock");
      for (const axis of SCORE_AXES) {
        expect(racquet.scores[axis]).toBeGreaterThanOrEqual(0);
        expect(racquet.scores[axis]).toBeLessThanOrEqual(100);
      }
    }
  });

  it("recommends deterministic real racquet matches", () => {
    const target = {
      power: 0.4,
      control: 0.1,
      maneuverability: 0.1,
      forgiveness: 0.3,
      comfort: 0.1,
    };

    const first = recommendCatalog(target, { limit: 3 });
    const second = recommendCatalog(target, { limit: 3 });

    expect(first.map((match) => match.racquet.slug)).toEqual(
      second.map((match) => match.racquet.slug),
    );
    expect(first).toHaveLength(3);
    expect(first[0].distance).toBeLessThanOrEqual(first[1].distance);
  });
});
