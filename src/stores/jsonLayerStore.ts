import { create } from "zustand";
import type { RGBAColor } from "../types/geometry/color";
import type { SpatialId } from "../types/geometry/spatioTemporalId";

export interface JsonSpatialId extends SpatialId {
  ref: number;
  color: RGBAColor;
  value: number;
}

export interface JsonMetaData {
  version: string;
  description?: string;
}

export interface JsonLayerData {
  meta?: JsonMetaData;
  name: string;
  values: number[];
  ids: JsonSpatialId[];
}

interface JsonLayerState {
  data: JsonLayerData | null;
  visible: boolean;
  opacity: number;
  setData: (data: JsonLayerData | null) => void;
  setVisible: (visible: boolean) => void;
  setOpacity: (opacity: number) => void;
  clearData: () => void;
}

export const useJsonLayerStore = create<JsonLayerState>((set) => ({
  data: null,
  visible: true,
  opacity: 255,
  setData: (data) => set({ data }),
  setVisible: (visible) => set({ visible }),
  setOpacity: (opacity) => set({ opacity }),
  clearData: () => set({ data: null }),
}));
