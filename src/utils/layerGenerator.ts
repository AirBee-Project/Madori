import { LineLayer, ScatterplotLayer } from "@deck.gl/layers";
import type { LayersList } from "deck.gl";
import type { Line } from "../types/geometry/line";
import type { Point } from "../types/geometry/point";

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

export function generateMapLayers(
  points: Point[],
  lines: Line[],
): LayersList {
  return [generatePointLayer(points), generateLineLayer(lines)];
}
