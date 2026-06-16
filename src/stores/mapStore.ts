import type { MapViewState } from "@deck.gl/core";
import type { Map as MapLibreGLMap } from "maplibre-gl";
import { create } from "zustand";

interface MapStore {
  viewState: MapViewState;
  setViewState: (viewState: MapViewState) => void;
  /** MapLibre のカメラ権限を持つため、地図インスタンスを保持する */
  mapInstance: MapLibreGLMap | null;
  setMapInstance: (map: MapLibreGLMap | null) => void;
  flyTo: (
    longitude: number,
    latitude: number,
    zoom?: number,
    pitch?: number,
  ) => void;
  is3DTerrainEnabled: boolean;
  toggle3DTerrain: () => void;
}

export const useMapStore = create<MapStore>((set, get) => ({
  viewState: {
    longitude: 139.767,
    latitude: 35.681,
    zoom: 10,
    pitch: 0,
    bearing: 0,
  },
  setViewState: (viewState) => set({ viewState }),
  mapInstance: null,
  setMapInstance: (mapInstance) => set({ mapInstance }),
  flyTo: (longitude, latitude, zoom = 15, pitch = 45) => {
    // カメラ権限は MapLibre 側にあるため、MapLibre のネイティブ flyTo で移動する。
    // viewState は MapGL の onMove が同期するため、ここでは更新しない。
    const map = get().mapInstance;
    if (!map) return;
    map.flyTo({
      center: [longitude, latitude],
      zoom,
      pitch,
      bearing: 0, // フォーカス移動時は北向きに戻す
      duration: 500,
    });
  },
  is3DTerrainEnabled: false,
  toggle3DTerrain: () =>
    set((state) => ({ is3DTerrainEnabled: !state.is3DTerrainEnabled })),
}));
