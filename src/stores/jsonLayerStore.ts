import type { RangeId } from "@airbee-project/kasane-client/spatial-id";
import { create } from "zustand";
import type { RGBAColor } from "../types/geometry/color";
import type { JsonValueType } from "../types/json/jsonSchema";

export interface JsonSpatialId {
  id: RangeId;
  ref: number;
  color: RGBAColor;
  value: JsonValueType;
}

export interface JsonMetaData {
  version: string;
  description?: string;
}

export interface JsonLayerData {
  meta?: JsonMetaData;
  name: string;
  values: JsonValueType[];
  ids: JsonSpatialId[];
}

/** 色は値ごとに決まるので、レイヤーで変えられるのは不透明度だけ */
export interface JsonLayer {
  id: string;
  data: JsonLayerData;
  opacity: number;
}

interface JsonLayerState {
  jsonLayers: Map<string, JsonLayer>;
  /** 追加したレイヤーの ID を返す */
  addJsonLayer: (data: JsonLayerData) => string;
  editJsonLayer: (id: string, updates: Partial<Omit<JsonLayer, "id">>) => void;
  removeJsonLayer: (id: string) => void;
}

// RangeId は不変のクラスなので、immer を通さず Map を作り直して更新する
export const useJsonLayerStore = create<JsonLayerState>((set) => ({
  jsonLayers: new Map(),
  addJsonLayer: (data) => {
    const id = crypto.randomUUID();
    set((state) => ({
      jsonLayers: new Map(state.jsonLayers).set(id, {
        id,
        data,
        opacity: 255,
      }),
    }));
    return id;
  },
  editJsonLayer: (id, updates) =>
    set((state) => {
      const layer = state.jsonLayers.get(id);
      if (!layer) return state;
      return {
        jsonLayers: new Map(state.jsonLayers).set(id, {
          ...layer,
          ...updates,
        }),
      };
    }),
  removeJsonLayer: (id) =>
    set((state) => {
      const jsonLayers = new Map(state.jsonLayers);
      jsonLayers.delete(id);
      return { jsonLayers };
    }),
}));
