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
 */
function pvoxelToCoordinates(voxel: PureVoxel): PvoxelCoordinates {
  const n = 2 ** voxel.Z;
  const lonPerTile = 360 / n;

  const minLon = -180 + lonPerTile * voxel.X;
  const maxLon = -180 + lonPerTile * (voxel.X + 1);

  const maxLat = mercatorYToLat((1 / n) * voxel.Y);
  const minLat = mercatorYToLat((1 / n) * (voxel.Y + 1));

  return { maxLon, minLon, maxLat, minLat };
}

/**
 * メルカトルY座標（0〜1）を緯度に変換
 */
function mercatorYToLat(y: number): number {
  return (90 - 180 * y) * 2;
}

/**
 * 標高の計算（Z, F を元に算出）
 */
function getAltitude(voxel: PureVoxel): number {
  return ((33554432 * 2) / 2 ** (voxel.Z + 2)) * voxel.F;
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
 * ビジュアライゼーション用の高さ（階層に応じて）
 */
function calculateElevation(voxel: PureVoxel): number {
  return 33554432 / 2 ** (voxel.Z + 1);
}
