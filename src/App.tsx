import { useMemo } from "react";
import DeckGL from "@deck.gl/react";
import { Map as MapGL } from "react-map-gl/maplibre";
import type { MapViewState } from "@deck.gl/core";
import "maplibre-gl/dist/maplibre-gl.css";
import { DrawModeToolbar } from "./components/draw-mode-manager";
import { FeatureManager } from "./components/feature-manager";
import { TimePanel } from "./components/time-manager";
import { useLineStore } from "./stores/lineStores";
import { usePointStore } from "./stores/pointStores";
import { useSpatialIdGroupStore } from "./stores/spatialIdGroupStores";
import { useMapStore } from "./stores/mapStore";
import { generateMapLayers, generateVoxelLayer } from "./utils/layerGenerator";
import { spatialIdGroupToGeometries } from "./utils/parser/voxelToGeometry";

export default function App() {
  const pointsMap = usePointStore((state) => state.points);
  const linesMap = useLineStore((state) => state.lines);
  const spatialIdGroupsMap = useSpatialIdGroupStore(
    (state) => state.spatialIdGroups,
  );
  const rangeMode = useSpatialIdGroupStore((state) => state.rangeMode);
  const viewState = useMapStore((state) => state.viewState);
  const setViewState = useMapStore((state) => state.setViewState);

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

  const layers = useMemo(() => {
    return [...baseLayers, ...voxelLayers];
  }, [baseLayers, voxelLayers]);

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
      <DeckGL
        viewState={viewState}
        onViewStateChange={(e) => setViewState(e.viewState as MapViewState)}
        controller={true}
        style={{ width: "100vw", height: "100vh" }}
        layers={layers}
      >
        <MapGL mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json" />
      </DeckGL>
    </div>
  );
}
