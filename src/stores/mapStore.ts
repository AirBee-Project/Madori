import { FlyToInterpolator, type MapViewState } from "@deck.gl/core";
import { create } from "zustand";

interface MapStore {
  viewState: MapViewState;
  setViewState: (viewState: MapViewState) => void;
  flyTo: (
    longitude: number,
    latitude: number,
    zoom?: number,
    pitch?: number,
  ) => void;
  isAutoRotating: boolean;
  toggleAutoRotation: () => void;
}

export const useMapStore = create<MapStore>((set) => ({
  viewState: {
    longitude: 139.767,
    latitude: 35.681,
    zoom: 10,
    pitch: 0,
    bearing: 0,
  },
  setViewState: (viewState) => set({ viewState }),
  flyTo: (longitude, latitude, zoom = 15, pitch = 45) =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        longitude,
        latitude,
        zoom,
        pitch,
        bearing: 0,
        transitionDuration: 1000,
        transitionInterpolator: new FlyToInterpolator(),
      },
    })),
  isAutoRotating: false,
  toggleAutoRotation: () =>
    set((state) => ({ isAutoRotating: !state.isAutoRotating })),
}));
