import type { RangeId } from "../api/kasane/types";
import { f_min, fxy_max } from "../types/geometry/spatioTemporalId/spatialId";

/**
 * ビューポート境界（緯度経度）を Kasane の ZFXY 範囲へ変換するユーティリティ。
 * 既存の voxelToGeometry（ZFXY→緯度経度）の逆変換。
 */

export type ZfxyRange = {
  z: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

/** 経度 → X タイル番号（n = 2^z） */
function lngToX(lng: number, n: number): number {
  return Math.floor(((lng + 180) / 360) * n);
}

/** 緯度 → Y タイル番号（n = 2^z、Web Mercator） */
function latToY(lat: number, n: number): number {
  const latRad = (lat * Math.PI) / 180;
  return Math.floor(
    (n * (Math.PI - Math.asinh(Math.tan(latRad)))) / (2 * Math.PI),
  );
}

/** 地図のズームとテーブルの max_zoom_level から問い合わせzを決める。 */
export function pickZoomLevel(mapZoom: number, maxZoomLevel: number): number {
  return clamp(Math.round(mapZoom), 0, Math.min(maxZoomLevel, 30));
}

/**
 * ビューポート境界（west/south/east/north）と z から x/y のタイル範囲を求める。
 */
export function boundsToZfxyRange(
  west: number,
  south: number,
  east: number,
  north: number,
  z: number,
): ZfxyRange {
  const n = 2 ** z;
  const maxIdx = fxy_max[z]; // 2^z - 1

  let xMin = clamp(lngToX(west, n), 0, maxIdx);
  let xMax = clamp(lngToX(east, n), 0, maxIdx);
  // 緯度が大きい(north)ほど y は小さい
  let yMin = clamp(latToY(north, n), 0, maxIdx);
  let yMax = clamp(latToY(south, n), 0, maxIdx);

  if (xMin > xMax) [xMin, xMax] = [xMax, xMin];
  if (yMin > yMax) [yMin, yMax] = [yMax, yMin];

  return { z, xMin, xMax, yMin, yMax };
}

/** 範囲が覆う x*y セル数（ロード量のガードに使用） */
export function rangeCellCount(range: ZfxyRange): number {
  return (range.xMax - range.xMin + 1) * (range.yMax - range.yMin + 1);
}

/**
 * 範囲を画面中心から ±radius タイルに制限する（近傍だけ取得して負荷を抑える）。
 * ビューポートが radius 以下なら変化しない（ズームイン時は従来どおり全体を取得）。
 */
export function clampRangeAroundCenter(
  range: ZfxyRange,
  radius: number,
): ZfxyRange {
  const cx = Math.floor((range.xMin + range.xMax) / 2);
  const cy = Math.floor((range.yMin + range.yMax) / 2);
  return {
    z: range.z,
    xMin: Math.max(range.xMin, cx - radius),
    xMax: Math.min(range.xMax, cx + radius),
    yMin: Math.max(range.yMin, cy - radius),
    yMax: Math.min(range.yMax, cy + radius),
  };
}

/**
 * x/y 範囲を RangeId に変換する。
 * f（高さ）は A案: その z の全範囲 [f_min[z], fxy_max[z]] を指定し、
 * 高さに関係なく存在するデータを取得する。
 */
export function zfxyRangeToRangeId(range: ZfxyRange): RangeId {
  return {
    z: range.z,
    f: [f_min[range.z], fxy_max[range.z]],
    x: [range.xMin, range.xMax],
    y: [range.yMin, range.yMax],
    type: "rangeId",
  };
}
