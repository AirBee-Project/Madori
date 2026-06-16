import type { LayersList, MapViewState } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Map as MapLibreGLMap } from "maplibre-gl";
import * as maplibregl from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";
import { Map as MapGL, useControl } from "react-map-gl/maplibre";
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

// 地理院標高タイルのエンコーディングを TerrainRGB に変換
function gsidemToTerrainRgb(r: number, g: number, b: number): number[] {
  let height = r * 655.36 + g * 2.56 + b * 0.01;
  if (r === 128 && g === 0 && b === 0) {
    height = 0;
  } else if (r >= 128) {
    height -= 167772.16;
  }
  height += 100000;
  height *= 10;
  const tB = (height / 256 - Math.floor(height / 256)) * 256;
  const tG =
    (Math.floor(height / 256) / 256 -
      Math.floor(Math.floor(height / 256) / 256)) *
    256;
  const tR =
    (Math.floor(Math.floor(height / 256) / 256) / 256 -
      Math.floor(Math.floor(Math.floor(height / 256) / 256) / 256)) *
    256;
  return [tR, tG, tB];
}

// 地理院標高タイル用プロトコルの登録
function setupGsiDemProtocol(): void {
  // biome-ignore lint/suspicious/noExplicitAny: maplibre-gl protocol requirement
  maplibregl.addProtocol("gsidem", (params: any) => {
    // biome-ignore lint/suspicious/noExplicitAny: maplibre-gl type limitation
    return new Promise<any>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "";
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );

        for (let i = 0; i < imageData.data.length / 4; i++) {
          const tRgb = gsidemToTerrainRgb(
            imageData.data[i * 4],
            imageData.data[i * 4 + 1],
            imageData.data[i * 4 + 2],
          );
          imageData.data[i * 4] = tRgb[0];
          imageData.data[i * 4 + 1] = tRgb[1];
          imageData.data[i * 4 + 2] = tRgb[2];
        }

        context.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }
          blob.arrayBuffer().then((arr) => {
            resolve({ data: arr });
          });
        });
      };
      image.onerror = () => {
        reject(new Error(`Failed to load image: ${params.url}`));
      };
      image.src = params.url.replace("gsidem://", "");
    });
  });
}

// 3D地形ソースの追加
function addDemSource(map: MapLibreGLMap): void {
  if (map.getSource("dem-source")) {
    return;
  }

  const demSource = {
    type: "raster-dem",
    tiles: [
      "gsidem://https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png",
    ],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 14,
    attribution: "国土地理院",
  };

  // biome-ignore lint/suspicious/noExplicitAny: maplibre-gl type limitation
  (map.addSource as any)("dem-source", demSource);
}

// テレイン設定の追加
function setTerrainView(map: MapLibreGLMap): void {
  try {
    map.setTerrain({
      source: "dem-source",
      exaggeration: 1,
    });
  } catch (error) {
    console.warn("Failed to set terrain:", error);
  }
}

// Hillshade レイヤーの追加
function addHillshadeLayer(map: MapLibreGLMap): void {
  if (map.getLayer("hillshade")) {
    return;
  }

  const hillshadeLayer = {
    id: "hillshade",
    source: "dem-source",
    type: "hillshade" as const,
    paint: {
      "hillshade-shadow-color": "#473B24",
      "hillshade-highlight-color": "#F3EDE9",
      "hillshade-exaggeration": 0.5,
    },
  };

  try {
    const layers = map.getStyle().layers;
    const beforeLayerId =
      layers?.find((layer) => layer.type === "symbol")?.id || undefined;
    map.addLayer(hillshadeLayer, beforeLayerId);
  } catch (error) {
    console.warn("Failed to add hillshade layer:", error);
  }
}

// テレイン設定の削除
function removeTerrain(map: MapLibreGLMap): void {
  try {
    map.setTerrain(null);
  } catch (error) {
    console.warn("Failed to remove terrain:", error);
  }

  if (map.getLayer("hillshade")) {
    try {
      map.removeLayer("hillshade");
    } catch (error) {
      console.warn("Failed to remove hillshade layer:", error);
    }
  }
}

// deck.gl を MapLibre の WebGL コンテキストに interleaved で重ねるオーバーレイ。
type DeckGLOverlayProps = ConstructorParameters<typeof MapboxOverlay>[0];

function DeckGLOverlay(props: DeckGLOverlayProps) {
  const overlay = useControl(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const MapContainer = () => {
  const viewState = useMapStore((state) => state.viewState);
  const setViewState = useMapStore((state) => state.setViewState);
  const setMapInstance = useMapStore((state) => state.setMapInstance);
  const is3DTerrainEnabled = useMapStore((state) => state.is3DTerrainEnabled);

  const pointsMap = usePointStore((state) => state.points);
  const linesMap = useLineStore((state) => state.lines);
  const spatialIdGroupsMap = useSpatialIdGroupStore(
    (state) => state.spatialIdGroups,
  );
  const rangeMode = useSpatialIdGroupStore((state) => state.rangeMode);

  // useRefを使用して再描画を防ぐ
  const hoveredVoxelIdRef = useRef<string | null>(null);
  const mapRef = useRef<MapLibreGLMap | null>(null);
  const protocolSetupRef = useRef(false);

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

  // 地理院標高タイルプロトコルの一度だけ登録
  useEffect(() => {
    if (!protocolSetupRef.current) {
      setupGsiDemProtocol();
      protocolSetupRef.current = true;
    }
  }, []);

  // 3D地形の設定
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    if (is3DTerrainEnabled) {
      addDemSource(map);
      setTerrainView(map);
      addHillshadeLayer(map);
    } else {
      removeTerrain(map);
    }
  }, [is3DTerrainEnabled]);

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
    <MapGL
      initialViewState={{
        longitude: viewState.longitude,
        latitude: viewState.latitude,
        zoom: viewState.zoom,
        pitch: viewState.pitch,
        bearing: viewState.bearing,
      }}
      mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
      style={{ width: "100vw", height: "100vh" }}
      onMove={(e) => setViewState(e.viewState as MapViewState)}
      onLoad={(event: { target: MapLibreGLMap }) => {
        mapRef.current = event.target;
        setMapInstance(event.target);
      }}
    >
      <DeckGLOverlay
        interleaved
        layers={layers}
        onHover={({ object }) => {
          hoveredVoxelIdRef.current = object?.voxelId || null;
        }}
        getTooltip={({ object }) =>
          object?.voxelId ? `${object.voxelId}` : null
        }
      />
    </MapGL>
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
