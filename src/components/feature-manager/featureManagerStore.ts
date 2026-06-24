import { create } from "zustand";

export type ActiveMode = "spatial" | "json" | "point" | "line" | null;

interface FeatureManagerState {
  activeMode: ActiveMode;
  toggleMode: (mode: ActiveMode) => void;
}

/**
 * パネルの表示状態を管理するストア
 */
export const useFeatureManagerStore = create<FeatureManagerState>((set) => ({
  activeMode: null,
  toggleMode: (mode) =>
    set((state) => ({
      activeMode: state.activeMode === mode ? null : mode,
    })),
}));
