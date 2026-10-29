import { create } from "zustand";

interface EmbedState {
  viewOnly: boolean;
  hasTime: boolean;
}

interface EmbedAction {
  setHasTime: (hasTime: boolean) => void;
}

export const useEmbedStore = create<EmbedState & EmbedAction>()((set) => ({
  viewOnly: new URLSearchParams(window.location.search).has("view"),
  hasTime: false,
  setHasTime: (hasTime) => set({ hasTime }),
}));
