import { describe, it, expect, beforeEach } from "vitest";
import { useBuildStore } from "./store";
import { DEFAULT_CONFIG } from "@/lib/domain/config";
import { encodeConfig } from "@/lib/share/codec";

describe("state/store", () => {
  beforeEach(() => useBuildStore.getState().reset());

  it("starts at default config with derived scores", () => {
    const s = useBuildStore.getState();
    expect(s.config).toEqual(DEFAULT_CONFIG);
    expect(s.scores().power).toBe(50);
  });
  it("setField updates config and prev for explanation", () => {
    useBuildStore.getState().setField("weightClass", "heavy");
    const s = useBuildStore.getState();
    expect(s.config.weightClass).toBe("heavy");
    expect(s.explanation()[0].toLowerCase()).toContain("maneuverability");
  });
  it("setField clamps tension", () => {
    useBuildStore.getState().setField("stringTensionLb", 999);
    expect(useBuildStore.getState().config.stringTensionLb).toBe(32);
  });
  it("hydrate accepts a valid token and ignores junk", () => {
    const token = encodeConfig({ ...DEFAULT_CONFIG, shape: "teardrop" });
    useBuildStore.getState().hydrateFromToken(token);
    expect(useBuildStore.getState().config.shape).toBe("teardrop");
    useBuildStore.getState().hydrateFromToken("garbage");
    expect(useBuildStore.getState().config.shape).toBe("teardrop"); // unchanged
  });
  it("token() reflects the current config", () => {
    useBuildStore.getState().setConfig({ ...DEFAULT_CONFIG, grip: "tacky" });
    expect(useBuildStore.getState().token()).toBe(encodeConfig({ ...DEFAULT_CONFIG, grip: "tacky" }));
  });
});
