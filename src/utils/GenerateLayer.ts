import { Color, LayersList } from "deck.gl";
import { GeoJsonLayer, PolygonLayer } from "@deck.gl/layers";
import { Item } from "../types/Item";
import { GeoJSON } from "geojson";
import { COORDINATE_SYSTEM } from "@deck.gl/core";
import colorHexToRgba from "./ColorHexToRgba";
import hyperVoxelToPureVoxel from "./HyperVoxelToPureVoxel";
import pvoxelToPolygon from "./PureVoxelToPolygon";
import {
  filterVoxelsByViewport,
  getDetailLevel,
  type ViewportState,
} from "./ViewportOptimization";

/**
 * ズームレベルに基づいてボクセル詳細度を調整
 */
function getDetailLevelForZoom(zoom: number): number {
  if (zoom < 5) return 0; // 非常にズームアウト - 最小限の詳細度
  if (zoom < 10) return 1; // ズームアウト - 低詳細度
  if (zoom < 15) return 2; // 中程度のズーム
  return 3; // ズームイン - 最大詳細度
}

/**
 * ポリゴン変換結果のキャッシュ
 * キー: "voxelId_detailLevel_time"
 */
const polygonCache = new Map<string, Polygon[]>();

function getCacheKey(
  voxelId: number,
  detailLevel: number,
  currentTime: number,
): string {
  return `${voxelId}_${detailLevel}_${Math.floor(currentTime / 10)}`; // 10秒単位でキャッシュ
}

function getOrGeneratePolygonsForVoxel(
  voxelItem: Item<"voxel">,
  compileMode: boolean,
  detailLevel: number,
  currentTime: number,
): Polygon[] {
  const cacheKey = getCacheKey(voxelItem.id, detailLevel, currentTime);

  // キャッシュ存在確認
  if (polygonCache.has(cacheKey)) {
    return polygonCache.get(cacheKey)!;
  }

  // キャッシュなし：新規生成
  let filteredVoxels = voxelItem.data.voxel;

  if (detailLevel < 3) {
    const maxZoom = 8 + detailLevel * 3;
    filteredVoxels = filteredVoxels.filter((v) => v.Z <= maxZoom);
  }

  // ポリゴン数の多さを制限（LOD）
  if (detailLevel === 0) {
    if (filteredVoxels.length > 100) {
      filteredVoxels = filteredVoxels.slice(
        0,
        Math.max(25, Math.floor(filteredVoxels.length / 4)),
      );
    }
  } else if (detailLevel === 1) {
    if (filteredVoxels.length > 200) {
      filteredVoxels = filteredVoxels.slice(
        0,
        Math.max(100, Math.floor(filteredVoxels.length / 2)),
      );
    }
  }

  const pureVoxel = hyperVoxelToPureVoxel(filteredVoxels, compileMode);
  const polygons = pvoxelToPolygon(
    pureVoxel,
    colorHexToRgba(voxelItem.data.color, voxelItem.data.opacity),
  );

  const result: Polygon[] = [];
  for (const p of polygons) {
    if (p.startTime === null && p.endTime === null) {
      result.push(p);
    } else if (
      p.startTime !== null &&
      p.endTime !== null &&
      p.startTime <= currentTime &&
      currentTime < p.endTime
    ) {
      result.push(p);
    }
  }

  // キャッシュに登録（容量制限あり）
  if (polygonCache.size > 500) {
    const firstKey = polygonCache.keys().next().value;
    if (firstKey) {
      polygonCache.delete(firstKey);
    }
  }
  polygonCache.set(cacheKey, result);
  return result;
}

/**
 * StateであるItem[]を入れると、DeckglのLayerに変換し出力する関数
 */
export default function generateLayer(
  item: Item[],
  isMapVisible: boolean = true,
  compileMode: boolean = true,
  currentTime: number = 0,
  viewState?: { zoom: number; longitude: number; latitude: number },
): LayersList {
  let pointItem: Item<"point">[] = item.filter(
    (e): e is Item<"point"> =>
      !e.isDeleted && !e.isVisible && e.type === "point",
  );
  let lineItem: Item<"line">[] = item.filter(
    (e): e is Item<"line"> => !e.isDeleted && !e.isVisible && e.type === "line",
  );

  let voxelItem: Item<"voxel">[] = item.filter(
    (e): e is Item<"voxel"> =>
      !e.isDeleted && !e.isVisible && e.type === "voxel",
  );

  // ズームレベルに基づく詳細度を取得
  const detailLevel = viewState ? getDetailLevelForZoom(viewState.zoom) : 3;

  // ズームがぼかしすぎている場合、ボクセルレンダリングをスキップ
  const shouldSkipVoxels = viewState && viewState.zoom < 3;

  // ビューポートフィルタリング：ビューポート外のボクセルを除外
  // ただし、フィルタリング後にボクセルが0になったら、元のデータを使用（新規追加時の対応）
  const filteredVoxelItem =
    !shouldSkipVoxels && viewState && voxelItem.length > 0
      ? voxelItem
          .map((item) => {
            const filtered = filterVoxelsByViewport(item.data.voxel, {
              zoom: viewState.zoom,
              longitude: viewState.longitude,
              latitude: viewState.latitude,
            });
            // フィルタリング結果が空の場合は元データを使用
            return {
              ...item,
              data: {
                ...item.data,
                voxel: filtered.length > 0 ? filtered : item.data.voxel,
              },
            };
          })
          .filter((item) => item.data.voxel.length > 0)
      : voxelItem;

  //PointはまとめてGeoJsonLayerとして表示
  const pointGeoJsonLayer = new GeoJsonLayer({
    id: "GeoJsonLayer",
    data: generatePointGeoJson(pointItem),
    pickable: true,
    filled: true,
    pointRadiusUnits: "pixels",
    pointRadiusMinPixels: 1,
    pointRadiusScale: 1,
    getFillColor: (d) => d.properties.color, // 個別カラー
    getRadius: (d) => d.properties.radius, // 個別サイズ
  });

  //LineはまとめてGeoJsonLayerとして表示
  const lineGeoJsonLayer = new GeoJsonLayer({
    id: "geojson-lines",
    data: generateLineGeoJson(lineItem),
    pickable: true,
    stroked: true,
    filled: false,
    lineWidthUnits: "pixels",
    getLineColor: (d) => d.properties.color as Color,
    getLineWidth: (d) => d.properties.width,
  });

  // ポリゴンデータを色別にグループ化
  const polygonsByColor = groupPolygonsByColor(
    shouldSkipVoxels
      ? []
      : generatePolygonLayer(
          filteredVoxelItem,
          compileMode,
          currentTime,
          detailLevel,
        ),
  );

  // 色ごとに異なるPolygonLayerを作成
  const voxelPolygonLayers = Object.entries(polygonsByColor).map(
    ([colorKey, polygons]) =>
      new PolygonLayer({
        id: `PolygonLayer-${colorKey}`,
        data: polygons,
        extruded: true,
        wireframe: true,
        filled: true,
        getPolygon: (d) => d.points,
        getElevation: (d) => d.elevation,
        getFillColor: (d) => d.color,
        getLineColor: [255, 255, 255, 125],
        getLineWidth: 100,
        lineWidthUnits: "pixels",
        lineWidthScale: 1,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 0, 200],
      }),
  );

  const layersList: LayersList = [
    pointGeoJsonLayer,
    lineGeoJsonLayer,
    ...voxelPolygonLayers,
  ];
  return layersList;
}

function generatePointGeoJson(point: Item<"point">[]): GeoJSON {
  const result: GeoJSON = {
    type: "FeatureCollection",
    features: [],
  };

  for (let i = 0; i < point.length; i++) {
    result.features.push({
      type: "Feature",
      properties: {
        color: colorHexToRgba(point[i].data.color, point[i].data.opacity),
        radius: point[i].data.size,
      },
      geometry: {
        type: "Point",
        coordinates: [point[i].data.lon, point[i].data.lat], // 東京
      },
    });
  }

  return result;
}

function generateLineGeoJson(line: Item<"line">[]): GeoJSON {
  const result: GeoJSON = {
    type: "FeatureCollection",
    features: [],
  };
  for (let i = 0; i < line.length; i++) {
    result.features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [line[i].data.lon1, line[i].data.lat1],
          [line[i].data.lon2, line[i].data.lat2],
        ],
      },
      properties: {
        color: colorHexToRgba(line[i].data.color, line[i].data.opacity), // 赤
        width: line[i].data.size,
      },
    });
  }
  return result;
}

type ColorMap = {
  [colorKey: string]: Polygon[];
};

type Polygon = {
  points: number[][];
  elevation: number;
  voxelID: string;
  color: Color;
  startTime: number | null;
  endTime: number | null;
};

/**
 * ポリゴンを色ごとにグループ化
 * 同じ色のポリゴンは1つのレイヤーで描画されるため、パフォーマンス向上
 */
function groupPolygonsByColor(polygons: Polygon[]): ColorMap {
  const result: ColorMap = {};
  for (const polygon of polygons) {
    const key = polygon.color.join(",");
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(polygon);
  }
  return result;
}
function generatePolygonLayer(
  voxel: Item<"voxel">[],
  compileMode: boolean,
  currentTime: number,
  detailLevel: number = 3,
): Polygon[] {
  // キャッシング機構を使用：結果を再利用
  const result: Polygon[] = [];

  for (const voxelItem of voxel) {
    const polygons = getOrGeneratePolygonsForVoxel(
      voxelItem,
      compileMode,
      detailLevel,
      currentTime,
    );
    result.push(...polygons);
  }

  return result;
}
