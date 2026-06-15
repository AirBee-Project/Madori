import type { LayersList, MapViewState } from "@deck.gl/core";
import DeckGL from "@deck.gl/react";
import { useEffect, useMemo, useRef } from "react";
import { Map as MapGL } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useJsonLayerStore } from "../../stores/jsonLayerStore";
import { useLineStore } from "../../stores/lineStores";
import { useMapStore } from "../../stores/mapStore";
import { usePointStore } from "../../stores/pointStores";
import { useSpatialIdGroupStore } from "../../stores/spatialIdGroupStores";
import { useTimeStore } from "../../stores/timeStore";
import {
  generateJsonVoxelLayer,
  generateMapLayers,
  generateVoxelLayer,
} from "../../utils/layerGenerator";
import { jsonToGeometry } from "../../utils/parser/jsonToGeometry";
import { spatialIdGroupToGeometries } from "../../utils/parser/voxelToGeometry";

export default function MapContainer() {
  const viewState = useMapStore((state) => state.viewState);
  const setViewState = useMapStore((state) => state.setViewState);

  const pointsMap = usePointStore((state) => state.points);
  const linesMap = useLineStore((state) => state.lines);
  const spatialIdGroupsMap = useSpatialIdGroupStore(
    (state) => state.spatialIdGroups,
  );
  const rangeMode = useSpatialIdGroupStore((state) => state.rangeMode);
  const currentTime = useTimeStore((state) => state.currentTime);

  const {
    data: jsonData,
    visible: jsonVisible,
    opacity: jsonOpacity,
  } = useJsonLayerStore();

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

  const allGeometriesMap = useMemo(() => {
    const groupsList = Array.from(spatialIdGroupsMap.values());
    return groupsList.map((group) => {
      return {
        group,
        geometries: spatialIdGroupToGeometries(group, rangeMode),
      };
    });
  }, [spatialIdGroupsMap, rangeMode]);

  const voxelLayers = useMemo(() => {
    return allGeometriesMap.map(({ group, geometries }) => {
      const filteredGeometries = geometries.filter((geom) => {
        if (geom.startTime === null || geom.endTime === null) return true;
        return geom.startTime <= currentTime && currentTime <= geom.endTime;
      });
      return generateVoxelLayer(group.id, filteredGeometries, group.color);
    });
  }, [allGeometriesMap, currentTime]);

  const jsonGeometries = useMemo(() => {
    if (!jsonData || !jsonVisible) return [];
    return jsonToGeometry(jsonData, rangeMode);
  }, [jsonData, jsonVisible, rangeMode]);

  const jsonLayer = useMemo(() => {
    if (!jsonData || !jsonVisible || jsonGeometries.length === 0) return null;
    const filteredJsonGeometries = jsonGeometries.filter((geom) => {
      if (geom.startTime === null || geom.endTime === null) return true;
      return geom.startTime <= currentTime && currentTime <= geom.endTime;
    });
    return generateJsonVoxelLayer(
      "json-layer",
      filteredJsonGeometries,
      jsonOpacity,
    );
  }, [jsonData, jsonVisible, jsonGeometries, currentTime, jsonOpacity]);

  const layers: LayersList = useMemo(() => {
    const list = [...baseLayers, ...voxelLayers];
    if (jsonLayer) {
      list.push(jsonLayer);
    }
    return list;
  }, [baseLayers, voxelLayers, jsonLayer]);

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
      getTooltip={({ object }) => {
        if (!object?.voxelId) return null;
        if (object.value !== undefined) {
          return `${object.voxelId} | ${object.value}`;
        }
        return `${object.voxelId}`;
      }}
    >
      <MapGL mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json" />
    </DeckGL>
  );
}
