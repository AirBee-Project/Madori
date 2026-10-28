import type { LayersList, MapViewState } from "@deck.gl/core";
import DeckGL, { type DeckGLRef } from "@deck.gl/react";
import { useEffect, useMemo, useRef } from "react";
import { Map as MapGL, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useGraphGroupStore } from "../../stores/graphGroupStores";
import { useJsonLayerStore } from "../../stores/jsonLayerStore";
import { useLineStore } from "../../stores/lineStores";
import { useMapStore } from "../../stores/mapStore";
import { usePointStore } from "../../stores/pointStores";
import { useSpatialIdGroupStore } from "../../stores/spatialIdGroupStores";
import { useTimeStore } from "../../stores/timeStore";
import {
  generateGraphLayers,
  generateJsonVoxelLayer,
  generateMapLayers,
  generateVoxelLayer,
} from "../../utils/layerGenerator";
import { graphGroupToGeometries } from "../../utils/parser/graphToGeometry";
import { jsonToGeometry } from "../../utils/parser/jsonToGeometry";
import { spatialIdGroupToGeometries } from "../../utils/parser/voxelToGeometry";
import { saveMapScreenshot } from "./screenshot";

export default function MapContainer() {
  const viewState = useMapStore((state) => state.viewState);
  const setViewState = useMapStore((state) => state.setViewState);
  const isAutoRotating = useMapStore((state) => state.isAutoRotating);

  const pointsMap = usePointStore((state) => state.points);
  const linesMap = useLineStore((state) => state.lines);
  const spatialIdGroupsMap = useSpatialIdGroupStore(
    (state) => state.spatialIdGroups,
  );
  const rangeMode = useSpatialIdGroupStore((state) => state.rangeMode);
  const showBorder = useSpatialIdGroupStore((state) => state.showBorder);
  const pickable = useSpatialIdGroupStore((state) => state.pickable);
  const currentTime = useTimeStore((state) => state.currentTime);
  const graphGroupsMap = useGraphGroupStore((state) => state.graphGroups);

  const {
    data: jsonData,
    visible: jsonVisible,
    opacity: jsonOpacity,
  } = useJsonLayerStore();

  const deckRef = useRef<DeckGLRef>(null);
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    useMapStore.setState({
      takeScreenshot: async () => {
        const deck = deckRef.current?.deck;
        const map = mapRef.current?.getMap();
        if (!deck || !map) return;
        await saveMapScreenshot(deck, map);
      },
    });
    return () => useMapStore.setState({ takeScreenshot: null });
  }, []);

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

  useEffect(() => {
    if (!isAutoRotating) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const rotate = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      // 回転度
      const degreesPerMs = 30 / 1000;
      const rotationAmount = deltaTime * degreesPerMs;

      const currentViewState = useMapStore.getState().viewState;
      setViewState({
        ...currentViewState,
        bearing: ((currentViewState.bearing || 0) + rotationAmount) % 360,
        transitionDuration: 0,
      });

      animationFrameId = requestAnimationFrame(rotate);
    };

    animationFrameId = requestAnimationFrame(rotate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoRotating, setViewState]);

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
      return generateVoxelLayer(
        group.id,
        filteredGeometries,
        group.color,
        showBorder,
        pickable,
      );
    });
  }, [allGeometriesMap, currentTime, showBorder, pickable]);

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
      showBorder,
      pickable,
    );
  }, [
    jsonData,
    jsonVisible,
    jsonGeometries,
    currentTime,
    jsonOpacity,
    showBorder,
    pickable,
  ]);

  const graphLayers = useMemo(() => {
    const groupsList = Array.from(graphGroupsMap.values());
    return groupsList.flatMap((group) => {
      const { points, edges } = graphGroupToGeometries(group);
      return generateGraphLayers(
        group.id,
        points,
        edges,
        group.nodeColor,
        group.edgeColor,
      );
    });
  }, [graphGroupsMap]);

  const layers: LayersList = useMemo(() => {
    const list = [...baseLayers, ...voxelLayers, ...graphLayers];
    if (jsonLayer) {
      list.push(jsonLayer);
    }
    return list;
  }, [baseLayers, voxelLayers, graphLayers, jsonLayer]);

  return (
    <DeckGL
      ref={deckRef}
      viewState={viewState}
      onViewStateChange={(e) => setViewState(e.viewState as MapViewState)}
      controller={true}
      // 高DPI画面でも論理ピクセル基準で描画し、描画負荷を抑える
      useDevicePixels={false}
      style={{ width: "100vw", height: "100vh" }}
      layers={layers}
      onHover={({ object }) => {
        if (!pickable) {
          hoveredVoxelIdRef.current = null;
          return;
        }
        hoveredVoxelIdRef.current = object?.voxelId || null;
      }}
      getTooltip={({ object }) => {
        if (!pickable) return null;
        if (!object?.voxelId) return null;
        if (object.value !== undefined) {
          return `${object.voxelId} | ${object.value}`;
        }
        return `${object.voxelId}`;
      }}
    >
      <MapGL
        ref={mapRef}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
      />
    </DeckGL>
  );
}
