import { create } from "zustand";
import { DEFAULT_CONFIG, clampTension, type RacquetConfig } from "@/lib/domain/config";
import { score } from "@/lib/scoring/score";
import { explain } from "@/lib/scoring/explain";
import type { ScoreVector } from "@/lib/domain/score";
import { encodeConfig, decodeConfig } from "@/lib/share/codec";

interface BuildState {
  config: RacquetConfig;
  prev: RacquetConfig;
  setField: <K extends keyof RacquetConfig>(key: K, value: RacquetConfig[K]) => void;
  setConfig: (config: RacquetConfig) => void;
  hydrateFromToken: (token: string | null | undefined) => void;
  reset: () => void;
  // derived
  scores: () => ScoreVector;
  explanation: () => string[];
  token: () => string;
}

export const useBuildStore = create<BuildState>((set, get) => ({
  config: DEFAULT_CONFIG,
  prev: DEFAULT_CONFIG,
  setField: (key, value) =>
    set((s) => {
      const next: RacquetConfig = {
        ...s.config,
        [key]: key === "stringTensionLb" ? clampTension(value as number) : value,
      };
      return { prev: s.config, config: next };
    }),
  setConfig: (config) => set((s) => ({ prev: s.config, config })),
  hydrateFromToken: (token) => {
    const decoded = decodeConfig(token);
    if (decoded) set({ config: decoded, prev: decoded });
  },
  reset: () => set({ config: DEFAULT_CONFIG, prev: DEFAULT_CONFIG }),
  scores: () => score(get().config),
  explanation: () => explain(get().prev, get().config),
  token: () => encodeConfig(get().config),
}));
