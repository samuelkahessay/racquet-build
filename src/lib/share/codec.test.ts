import { describe, it, expect } from "vitest";
import { encodeConfig, decodeConfig } from "./codec";
import {
  DEFAULT_CONFIG,
  SHAPES,
  WEIGHT_CLASSES,
  BALANCES,
  GRIPS,
  TENSION_MIN,
  TENSION_MAX,
  type RacquetConfig,
} from "@/lib/domain/config";

describe("share/codec", () => {
  it("round-trips the default config", () => {
    expect(decodeConfig(encodeConfig(DEFAULT_CONFIG))).toEqual(DEFAULT_CONFIG);
  });
  it("round-trips the full matrix", () => {
    for (const shape of SHAPES)
      for (const weightClass of WEIGHT_CLASSES)
        for (const balance of BALANCES)
          for (const grip of GRIPS)
            for (const t of [TENSION_MIN, 26, TENSION_MAX]) {
              const cfg: RacquetConfig = { shape, weightClass, balance, grip, stringTensionLb: t };
              expect(decodeConfig(encodeConfig(cfg))).toEqual(cfg);
            }
  });
  it("returns null for malformed input", () => {
    for (const bad of ["", "garbage", "9.h.m.e.s.26", "1.x.m.e.s.26", "1.h.m.e.s.99", "1.h.m.e.s"]) {
      expect(decodeConfig(bad)).toBeNull();
    }
  });
  it("produces a short URL-safe token", () => {
    const token = encodeConfig(DEFAULT_CONFIG);
    expect(token).toMatch(/^[A-Za-z0-9.\-]+$/);
    expect(token.length).toBeLessThan(20);
  });
});
