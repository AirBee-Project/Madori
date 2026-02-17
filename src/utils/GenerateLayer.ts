import { Color, LayersList } from "deck.gl";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer, GeoJsonLayer, PolygonLayer } from "@deck.gl/layers";
import { Item } from "../types/Item";
import { GeoJSON } from "geojson";
import { COORDINATE_SYSTEM } from "@deck.gl/core";
import colorHexToRgba from "./ColorHexToRgba";
import hyperVoxelToPureVoxel from "./HyperVoxelToPureVoxel";
import pvoxelToPolygon from "./PureVoxelToPolygon";
/**
 * StateであるItem[]を入れると、DeckglのLayerに変換し出力する関数a
 */
export default function generateLayer(item: Item[], isMapVisible: boolean = true, compileMode: boolean = true, currentTime: number = 0): LayersList {
  let pointItem: Item<"point">[] = item.filter(
    (e): e is Item<"point"> =>
      !e.isDeleted && !e.isVisible && e.type === "point"
  );
  let lineItem: Item<"line">[] = item.filter(
    (e): e is Item<"line"> => !e.isDeleted && !e.isVisible && e.type === "line"
  );

  let voxelItem: Item<"voxel">[] = item.filter(
    (e): e is Item<"voxel"> =>
      !e.isDeleted && !e.isVisible && e.type === "voxel"
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
    getLineColor: (d) => d.properties.color as Color,
    getLineWidth: (d) => d.properties.width,
  });

  //PolygonLayerとして出力

  const voxelPolygonLayer = new PolygonLayer({
    // coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS,
    id: "PolygonLayer",
    data: generatePolygonLayer(voxelItem, compileMode, currentTime),
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
  });


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
    voxelPolygonLayer,
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

type Polygon = {
  points: number[][];
  elevation: number;
  voxelID: string;
  color: Color;
  startTime: number | null;
  endTime: number | null;
};
function generatePolygonLayer(voxel: Item<"voxel">[], compileMode: boolean, currentTime: number): Polygon[] {
  let result: Polygon[] = [];
  for (let i = 0; i < voxel.length; i++) {
    let pureVoxel = hyperVoxelToPureVoxel(voxel[i].data.voxel, compileMode);
    let polygon = pvoxelToPolygon(
      pureVoxel,
      colorHexToRgba(voxel[i].data.color, voxel[i].data.opacity)
    );
    for (const p of polygon) {
      if (p.startTime === null && p.endTime === null) {
        result.push(p);
      } else if (p.startTime !== null && p.endTime !== null && p.startTime <= currentTime && currentTime < p.endTime) {
        result.push(p);
      }
    }
  }
  return result;
}
