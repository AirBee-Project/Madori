import {
  LineLayer,
  ScatterplotLayer,
  SolidPolygonLayer,
} from "@deck.gl/layers";
import type { LayersList } from "deck.gl";
import type { RGBAColor } from "../types/geometry/color";
import type { Line } from "../types/geometry/line";
import type { Point } from "../types/geometry/point";
import type { VoxelGeometry } from "../types/geometry/spatioTemporalId/voxelGeometry";

function generatePointLayer(points: Point[]): ScatterplotLayer<Point> {
  return new ScatterplotLayer<Point>({
    id: "scatterplot-layer",
    data: points,
    pickable: true,
    opacity: 0.8,
    stroked: false,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 6,
    radiusMaxPixels: 100,
    getPosition: (d) => [d.longitude, d.latitude, d.altitude],
    getRadius: 10,
    getFillColor: (d) => {
      if (d.color) {
        return [d.color.r, d.color.g, d.color.b, d.color.a];
      }
      return [15, 118, 110, 255];
    },
    billboard: true,
  });
}

function generateLineLayer(lines: Line[]): LineLayer<Line> {
  return new LineLayer<Line>({
    id: "line-layer",
    data: lines,
    pickable: true,
    getSourcePosition: (d) => [
      d.start.longitude,
      d.start.latitude,
      d.start.altitude,
    ],
    getTargetPosition: (d) => [d.end.longitude, d.end.latitude, d.end.altitude],
    getColor: (d) => {
      if (d.color) {
        return [d.color.r, d.color.g, d.color.b, d.color.a];
      }
      return [15, 118, 110, 255];
    },
    getWidth: (d) => d.width ?? 2,
    widthMinPixels: 1,
  });
}

export function generateVoxelLayer(
  id: string,
  geometries: VoxelGeometry[],
  color: RGBAColor,
): SolidPolygonLayer<VoxelGeometry> {
  return new SolidPolygonLayer<VoxelGeometry>({
    id: `voxel-layer-${id}`,
    data: geometries,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 150],
    extruded: true,
    wireframe: true,
    getPolygon: (d) => d.points,
    getElevation: (d) => d.elevation,
    getFillColor: [color.r, color.g, color.b, color.a],
    getLineColor: [0, 0, 0, 255],
    updateTriggers: {
      getFillColor: [color],
    },
  });
}

export function generateJsonVoxelLayer(
  id: string,
  geometries: VoxelGeometry[],
  opacity: number,
): SolidPolygonLayer<VoxelGeometry> {
  return new SolidPolygonLayer<VoxelGeometry>({
    id: `json-voxel-layer-${id}`,
    data: geometries,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 150],
    extruded: true,
    wireframe: true,
    getPolygon: (d) => d.points,
    getElevation: (d) => d.elevation,
    getFillColor: (d) => {
      const c = d.color ?? { r: 100, g: 100, b: 100, a: 255 };
      return [c.r, c.g, c.b, opacity];
    },
    getLineColor: [0, 0, 0, 255],
    updateTriggers: {
      getFillColor: [opacity],
    },
  });
}

export function generateMapLayers(points: Point[], lines: Line[]): LayersList {
  return [generatePointLayer(points), generateLineLayer(lines)];
}
