type Polygon = {
  points: number[][]; // 経度・緯度・標高の三次元座標
  elevation: number; // 高さ情報（階層に応じて）
  voxelID: string; // 一意のID
  color: Color;
};
import { Color } from "deck.gl";
import { PureVoxel } from "../types/PureVoxel";

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
      voxelID: generateVoxelID(voxel),
      color: color,
    };
  });
}


export function pvoxelToCoordinates(voxel: PureVoxel): PvoxelCoordinates {
  const n = 2 ** voxel.Z;
  const lonPerTile = 360 / n;

  const minLon = -180 + lonPerTile * voxel.X;
  const maxLon = -180 + lonPerTile * (voxel.X + 1);

  const maxLat =
    (Math.atan(Math.sinh(Math.PI - (voxel.Y / n) * 2 * Math.PI)) * 180) /
    Math.PI;
  const minLat =
    (Math.atan(Math.sinh(Math.PI - ((voxel.Y + 1) / n) * 2 * Math.PI)) * 180) /
    Math.PI;

  return { maxLon, minLon, maxLat, minLat };

}


export function getAltitude(voxel: PureVoxel): number {
  // 底面標高 = f × (H / n) = f × 2^(25-Z)
  const voxelHeight = Math.pow(2, 25 - voxel.Z);
  return voxel.F * voxelHeight;
}

/**
 * ポリゴンの外接矩形ポイントを生成（上から時計回り + 最後に始点をもう一度）
 */
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
    [maxLon, maxLat, altitude], // クローズポリゴン
  ];
}

function generateVoxelID(voxel: PureVoxel): string {
  return `${voxel.Z}/${voxel.F}/${voxel.X}/${voxel.Y}`;
}


export function calculateElevation(voxel: PureVoxel): number {
  return Math.pow(2, 25 - voxel.Z);
}

export type VoxelMeshProps = {
  position: [number, number, number]; // [x, y, z] in meters from origin
  size: [number, number, number]; // [width, depth, height] in meters
  voxelID: string;
};

/**
 * ボクセルをメートルオフセット座標に変換
 */
export function pvoxelToOffset(
  voxel: PureVoxel,
  origin: [number, number]
): VoxelMeshProps {
  const coordinates = pvoxelToCoordinates(voxel);
  const { maxLon, minLon, maxLat, minLat } = coordinates;
  const [originLon, originLat] = origin;

  // 中心座標
  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;

  // メートル単位のオフセット計算
  // 緯度1度あたりの距離 (約111km)
  const metersPerLat = 111319.49079327358;
  // 経度1度あたりの距離 (緯度によって変わる)
  const latRad = (centerLat * Math.PI) / 180;
  const metersPerLon = 111319.49079327358 * Math.cos(latRad);

  const x = (centerLon - originLon) * metersPerLon;
  const y = (centerLat - originLat) * metersPerLat;

  const bottomAltitude = getAltitude(voxel);

  const voxelHeight = calculateElevation(voxel);

  const sizeX = Math.abs(maxLon - minLon) * metersPerLon / 2;


  const sizeY = sizeX;


  const sizeZ = voxelHeight / 2;

  const z = bottomAltitude + voxelHeight / 2;

  return {
    position: [x, y, z],
    size: [sizeX, sizeY, sizeZ],
    voxelID: generateVoxelID(voxel),
  };
}


export type VoxelLngLatProps = {
  position: [number, number, number];
  size: [number, number, number];
  voxelID: string;
};

export function pvoxelToLngLat(voxel: PureVoxel): VoxelLngLatProps {
  const coordinates = pvoxelToCoordinates(voxel);
  const { maxLon, minLon, maxLat, minLat } = coordinates;

  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;

  const bottomAltitude = getAltitude(voxel);
  const voxelHeight = calculateElevation(voxel);
  const z = bottomAltitude + voxelHeight / 2;

  const latRad = (centerLat * Math.PI) / 180;

  // GRS80楕円体パラメータ
  const a = 6378137; // 長半径 (m)
  const f = 1 / 298.257222101; // 扁平率
  const e2 = f * (2 - f); // 離心率の2乗

  // 経度方向（東西）: GRS80楕円体上の距離
  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));
  const metersPerLonDeg = (Math.PI / 180) * N * Math.cos(latRad);
  const sizeX = Math.abs(maxLon - minLon) * metersPerLonDeg / 2;

  // 緯度方向（南北）: GRS80楕円体上の距離
  const M = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(latRad) * Math.sin(latRad), 1.5);
  const metersPerLatDeg = (Math.PI / 180) * M;
  const sizeY = Math.abs(maxLat - minLat) * metersPerLatDeg / 2;

  // deck.gl LNGLAT座標系のMercatorスケーリング(1/cos(lat))を打ち消す
  const sizeZ = (voxelHeight / 2) * Math.cos(latRad);
  const correctedZ = z * Math.cos(latRad);

  return {
    position: [centerLon, centerLat, correctedZ],
    size: [sizeX, sizeY, sizeZ],
    voxelID: generateVoxelID(voxel),
  };
}

