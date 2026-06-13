import type { LayersList, MapViewState } from "@deck.gl/core";
import DeckGL from "@deck.gl/react";
import { useEffect, useMemo, useRef } from "react";
import { Map as MapGL } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { DrawModeToolbar } from "./components/draw-mode-manager";
import { FeatureManager } from "./components/feature-manager";
import { TimePanel } from "./components/time-manager";
import { useLineStore } from "./stores/lineStores";
import { useMapStore } from "./stores/mapStore";
import { usePointStore } from "./stores/pointStores";
import { useSpatialIdGroupStore } from "./stores/spatialIdGroupStores";
import { generateMapLayers, generateVoxelLayer } from "./utils/layerGenerator";
import { spatialIdGroupToGeometries } from "./utils/parser/voxelToGeometry";

const MapContainer = () => {
  const viewState = useMapStore((state) => state.viewState);
  const setViewState = useMapStore((state) => state.setViewState);

  const pointsMap = usePointStore((state) => state.points);
  const linesMap = useLineStore((state) => state.lines);
  const spatialIdGroupsMap = useSpatialIdGroupStore(
    (state) => state.spatialIdGroups,
  );
  const rangeMode = useSpatialIdGroupStore((state) => state.rangeMode);

  // useRefを使用して再描画を防ぐ
  const hoveredVoxelIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const id = hoveredVoxelIdRef.current;
      if (e.ctrlKey && e.key === "c" && id) {
        navigator.clipboard
          .writeText(id)
          .then(() => {
            console.log("Copied to clipboard:", id);
          })
          .catch((err) => {
            console.error("Failed to copy to clipboard:", err);
          });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const baseLayers = useMemo(() => {
    const pointsList = Array.from(pointsMap.values());
    const linesList = Array.from(linesMap.values());
    return generateMapLayers(pointsList, linesList);
  }, [pointsMap, linesMap]);

  const voxelLayers = useMemo(() => {
    const groupsList = Array.from(spatialIdGroupsMap.values());
    return groupsList.map((group) => {
      const geometries = spatialIdGroupToGeometries(group, rangeMode);
      return generateVoxelLayer(group.id, geometries, group.color);
    });
  }, [spatialIdGroupsMap, rangeMode]);

  const layers: LayersList = useMemo(() => {
    return [...baseLayers, ...voxelLayers];
  }, [baseLayers, voxelLayers]);

  return (
    <DeckGL
      viewState={viewState}
      onViewStateChange={(e) => setViewState(e.viewState as MapViewState)}
      controller={true}
      style={{ width: "100vw", height: "100vh" }}
      layers={layers}
      onHover={({ object }) => {
        hoveredVoxelIdRef.current = object?.voxelId || null;
      }}
      getTooltip={({ object }) =>
        object?.voxelId ? `${object.voxelId}` : null
      }
    >
      <MapGL mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json" />
    </DeckGL>
  );
};

export default function App() {
  return (
    <div>
      {/* featuremanager */}
      <div style={{ position: "absolute", zIndex: 50 }}>
        <FeatureManager />
      </div>

      {/* timebar */}
      <TimePanel />

      {/* drawmodemanager */}
      <div
        style={{
          position: "absolute",
          zIndex: 50,
          bottom: "6rem",
          right: "1rem",
        }}
      >
        <DrawModeToolbar />
      </div>

      {/* map */}
      <MapContainer />
    </div>
  );
}
