import { Color } from "deck.gl";
import { PureVoxel } from "../types/PureVoxel";

type Polygon = {
  points: number[][];
  elevation: number;
  voxelID: string;
  color: Color;
};

type PvoxelCoordinates = {
  maxLon: number;
  minLon: number;
  maxLat: number;
  minLat: number;
};

export default function pvoxelToPolygon(
  pvoxels: PureVoxel[],
  color: Color
): Polygon[] {
  return pvoxels.map((voxel) => {
    const coordinates = pvoxelToCoordinates(voxel);
    const altitude = getAltitude(voxel);
    const points = generateRectanglePoints(coordinates, altitude);

    return {
      points,
      elevation: calculateElevation(voxel),
      voxelID: voxel.originalId,
      color: color,
    };
  });
}

function pvoxelToCoordinates(voxel: PureVoxel): PvoxelCoordinates {
  const n = 2 ** voxel.Z;
  const lonPerTile = 360 / n;

  const minLon = -180 + lonPerTile * voxel.X;
  const maxLon = -180 + lonPerTile * (voxel.X2 + 1);

  const maxLat =
    (Math.atan(Math.sinh(Math.PI - (voxel.Y / n) * 2 * Math.PI)) * 180) /
    Math.PI;
  const minLat =
    (Math.atan(Math.sinh(Math.PI - ((voxel.Y2 + 1) / n) * 2 * Math.PI)) * 180) /
    Math.PI;

  return { maxLon, minLon, maxLat, minLat };
}

function getAltitude(voxel: PureVoxel): number {
  return (33554432 / 2 ** voxel.Z) * voxel.F;
}

function generateRectanglePoints(
  coord: PvoxelCoordinates,
  altitude: number
): number[][] {
  const { maxLon, minLon, maxLat, minLat } = coord;

  return [
    [maxLon, maxLat, altitude],
    [minLon, maxLat, altitude],
    [minLon, minLat, altitude],
    [maxLon, minLat, altitude],
    [maxLon, maxLat, altitude],
  ];
}

function calculateElevation(voxel: PureVoxel): number {
  const fCount = voxel.F2 - voxel.F + 1;
  return (33554432 / 2 ** voxel.Z) * fCount;
}
