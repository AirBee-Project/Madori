// ==============================
// 型定義
// ==============================

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

// ==============================
// メイン処理
// ==============================

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

// ==============================
// 補助関数群
// ==============================

/**
 * 各ボクセルの経緯度範囲を計算
 * https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
 */
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

/**
 * IPA空間ID仕様に基づく底面標高の計算
 * 底面標高 = f × 2^(25-Z) メートル
 * H = 2^25 = 33,554,432m（鉛直方向の全体範囲）
 * 各ボクセルの高さ = H / 2^Z = 2^(25-Z) メートル
 */
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

/**
 * 表示用のボクセルIDを生成
 */
function generateVoxelID(voxel: PureVoxel): string {
  return `${voxel.Z}/${voxel.F}/${voxel.X}/${voxel.Y}`;
}

/**
 * IPA空間ID仕様に基づくボクセルの高さ計算
 * Z=25でボクセルの高さが1mになる
 * 高さ = 2^(25-Z) メートル
 * 緯度によらず一律（仕様書より）
 */
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

  // IPA空間ID仕様に基づく高さ計算
  // 底面標高 = f × 2^(25-Z) メートル
  const bottomAltitude = getAltitude(voxel);
  // ボクセルの高さ = 2^(25-Z) メートル（緯度によらず一律）
  const voxelHeight = calculateElevation(voxel);

  // 水平方向のサイズ計算（メートル単位）
  // CubeGeometry は 2x2x2 の立方体なので、スケールを半分にする
  // 経度方向のサイズ（メルカトルでcos(lat)がかかる）
  const sizeX = Math.abs(maxLon - minLon) * metersPerLon / 2;

  // IPA仕様: 東西方向と南北方向は同じ（赤道で等しく、高緯度で両方とも短くなる）
  const sizeY = sizeX;

  // 高さはIPA仕様に従う: 2^(25-Z) メートル
  // CubeGeometryの2x2x2を考慮して半分にする
  const sizeZ = voxelHeight / 2;

  // 立方体の中心 = 底面標高 + 高さ/2
  const z = bottomAltitude + voxelHeight / 2;

  return {
    position: [x, y, z],
    size: [sizeX, sizeY, sizeZ],
    voxelID: generateVoxelID(voxel),
  };
}

/**
 * LNGLAT座標系用: ボクセルを経緯度座標で返す
 * METER_OFFSETSの「地図外に飛ぶ」問題を回避
 */
export type VoxelLngLatProps = {
  position: [number, number, number]; // [longitude, latitude, altitude]
  size: [number, number, number]; // [width, depth, height] in meters
  voxelID: string;
};

export function pvoxelToLngLat(voxel: PureVoxel): VoxelLngLatProps {
  const coordinates = pvoxelToCoordinates(voxel);
  const { maxLon, minLon, maxLat, minLat } = coordinates;

  // 中心座標（経緯度）
  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;

  // IPA空間ID仕様に基づく高さ計算
  const bottomAltitude = getAltitude(voxel);
  const voxelHeight = calculateElevation(voxel);

  // 立方体の中心 = 底面標高 + 高さ/2
  const z = bottomAltitude + voxelHeight / 2;

  // 水平方向のサイズ計算（メートル単位）
  const latRad = (centerLat * Math.PI) / 180;
  const metersPerLon = 111319.49079327358 * Math.cos(latRad);
  const sizeX = Math.abs(maxLon - minLon) * metersPerLon / 2;
  // IPA仕様: 東西方向と南北方向は同じ（赤道で等しく、高緯度で両方とも短くなる）
  const sizeY = sizeX;
  const sizeZ = voxelHeight / 2;

  return {
    position: [centerLon, centerLat, z],
    size: [sizeX, sizeY, sizeZ],
    voxelID: generateVoxelID(voxel),
  };
}

