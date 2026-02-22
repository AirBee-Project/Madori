import { Color, LayersList } from "deck.gl";
import { GeoJsonLayer, PolygonLayer } from "@deck.gl/layers";
import { Item } from "../data/item";
import { GeoJSON } from "geojson";
import expandVoxelRange from "./expand-voxel-range";
import pvoxelToPolygon from "./voxel-to-polygon";

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

  const pointGeoJsonLayer = new GeoJsonLayer({
    id: "GeoJsonLayer",
    data: generatePointGeoJson(pointItem),
    pickable: true,
    filled: true,
    pointRadiusUnits: "pixels",
    pointRadiusMinPixels: 1,
    pointRadiusScale: 1,
    getFillColor: (d) => d.properties.color,
    getRadius: (d) => d.properties.radius,
  });

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

  const voxelPolygonLayer = new PolygonLayer({
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


  let reuslt: LayersList = [
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
        color: point[i].data.color,
        radius: point[i].data.size,
      },
      geometry: {
        type: "Point",
        coordinates: [point[i].data.lon, point[i].data.lat],
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
        color: line[i].data.color,
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
    let pureVoxel = expandVoxelRange(voxel[i].data.voxel, compileMode);
    let polygon = pvoxelToPolygon(
      pureVoxel,
      voxel[i].data.color
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
