import { Color, LayersList } from "deck.gl";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer, GeoJsonLayer } from "@deck.gl/layers";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import { CubeGeometry } from "@luma.gl/engine";
import { Item } from "../types/Item";
import { GeoJSON } from "geojson";
import { COORDINATE_SYSTEM } from "@deck.gl/core";
import colorHexToRgba from "./ColorHexToRgba";
import hyperVoxelToPureVoxel from "./HyperVoxelToPureVoxel";
import { pvoxelToLngLat } from "./PureVoxelToPolygon";

/**
 * StateであるItem[]を入れると、DeckglのLayerに変換し出力する関数a
 */
export default function generateLayer(item: Item[], isMapVisible: boolean = true): LayersList {
  let pointItem: Item<"point">[] = item.filter(
    (e): e is Item<"point"> =>
      !e.isDeleted && e.isVisible && e.type === "point"
  );
  let lineItem: Item<"line">[] = item.filter(
    (e): e is Item<"line"> => !e.isDeleted && e.isVisible && e.type === "line"
  );

  let voxelItem: Item<"voxel">[] = item.filter(
    (e): e is Item<"voxel"> =>
      !e.isDeleted && e.isVisible && e.type === "voxel"
  );

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
    getLineColor: (d) => d.properties.color as Color, // ← 色を個別設定
    getLineWidth: (d) => d.properties.width, // ← 太さを個別設定
  });

  //VoxelはSimpleMeshLayerとしてまとめて出力

  let voxelData: any[] = [];

  if (voxelItem.length > 0) {

    // 全ボクセルを変換
    for (const vItem of voxelItem) {
      const pVoxels = hyperVoxelToPureVoxel(vItem.data.voxel);
      const color = colorHexToRgba(vItem.data.color, vItem.data.opacity);

      for (const pv of pVoxels) {
        const lngLatProps = pvoxelToLngLat(pv);
        voxelData.push({
          position: lngLatProps.position,
          size: lngLatProps.size,
          color: color
        });
      }
    }
  }

  const cubeGeometry = new CubeGeometry();
  const voxelMeshLayers = voxelData.length > 0 ? [new SimpleMeshLayer({
    id: "VoxelMeshLayer",
    data: voxelData,
    mesh: cubeGeometry,
    coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
    getPosition: (d: any) => d.position,  // [lon, lat, alt]
    getColor: (d: any) => d.color,
    getOrientation: [0, 0, 0],
    getScale: (d: any) => d.size,
    material: false,
    pickable: true,
  })] : [];

  // 背景地図: Carto Voyager (明るい地図)
  const tileMapLayer = new TileLayer({
    id: "TileMapLayer",
    data: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
    maxZoom: 19,
    minZoom: 0,
    opacity: 1,
    renderSubLayers: (props) => {
      const { boundingBox } = props.tile;
      return new BitmapLayer(props, {
        data: undefined,
        image: props.data,
        bounds: [
          boundingBox[0][0],
          boundingBox[0][1],
          boundingBox[1][0],
          boundingBox[1][1],
        ],
      });
    },
    pickable: true,
  });

  let reuslt: LayersList = [
    ...(isMapVisible ? [tileMapLayer] : []),
    pointGeoJsonLayer,
    lineGeoJsonLayer,
    ...voxelMeshLayers,
  ];
  return reuslt;
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

// Polygon related code removed as we use Mesh now

