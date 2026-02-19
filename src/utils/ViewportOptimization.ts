/**
 * ビューポート最適化ユーティリティ
 * ズームレベルやビューポート範囲に基づいてレンダリング最適化を実施
 */

import { VoxelDefinition } from "../types/VoxelDefinition";

export interface ViewportState {
  zoom: number;
  longitude: number;
  latitude: number;
  pitch?: number;
  bearing?: number;
}

/**
 * ズームレベルに基づいて最小表示ズーム値を決定
 * 高ズーム値のボクセルはズームアウト時に省略できる
 */
export function getMinVoxelZoomLevel(mapZoom: number): number {
  if (mapZoom < 3) return 2; // ズームアウト状態：Z<=2のみ
  if (mapZoom < 6) return 4; // Z<=4
  if (mapZoom < 9) return 8; // Z<=8
  if (mapZoom < 12) return 12; // Z<=12
  if (mapZoom < 15) return 16; // Z<=16
  return 24; // ズームイン状態：全て表示
}

/**
 * 経度範囲チェック：-180-360のラップアラウンドに対応
 */
function longitudeInRange(lon: number, min: number, max: number): boolean {
  if (min <= max) {
    return lon >= min && lon <= max;
  }
  // ラップアラウンド対応
  return lon >= min || lon <= max;
}

/**
 * ビューポート内のボクセルのみをフィルタリング
 * 周辺タイルも含める（表示範囲外だが描画される可能性があるため）
 */
export function filterVoxelsByViewport(
  voxels: VoxelDefinition[],
  viewport: ViewportState,
  marginDegrees: number = 10,
): VoxelDefinition[] {
  const minZoomLevel = getMinVoxelZoomLevel(viewport.zoom);

  // 表示範囲を拡張（マージン含む）
  const lonMin = viewport.longitude - marginDegrees;
  const lonMax = viewport.longitude + marginDegrees;
  const latMin = Math.max(-85, viewport.latitude - marginDegrees);
  const latMax = Math.min(85, viewport.latitude + marginDegrees);

  return voxels.filter((voxel) => {
    // ズームレベルフィルタ：高すぎるズーム値は除外
    if (voxel.Z > minZoomLevel) {
      return false;
    }

    // 位置範囲フィルタ
    const n = 2 ** voxel.Z;
    const lonPerTile = 360 / n;
    const latPerTile = 180 / n;

    const xMin = typeof voxel.X === "number" ? voxel.X : voxel.X[0];
    const xMax = typeof voxel.X === "number" ? voxel.X : voxel.X[1];
    const yMin = typeof voxel.Y === "number" ? voxel.Y : voxel.Y[0];
    const yMax = typeof voxel.Y === "number" ? voxel.Y : voxel.Y[1];

    const voxelLonMin = -180 + lonPerTile * xMin;
    const voxelLonMax = -180 + lonPerTile * (xMax + 1);
    const voxelLatMin = 85 - latPerTile * (yMax + 1);
    const voxelLatMax = 85 - latPerTile * yMin;

    // 経度範囲の交差チェック
    const lonIntersects =
      longitudeInRange(voxelLonMin, lonMin, lonMax) ||
      longitudeInRange(voxelLonMax, lonMin, lonMax) ||
      longitudeInRange(viewport.longitude, voxelLonMin, voxelLonMax);

    // 緯度範囲の交差チェック
    const latIntersects = voxelLatMax >= latMin && voxelLatMin <= latMax;

    return lonIntersects && latIntersects;
  });
}

/**
 * 複数のボクセル定義セット向けビューポートフィルタリング
 */
export function filterVoxelArraysByViewport(
  voxelArrays: VoxelDefinition[][],
  viewport: ViewportState,
): VoxelDefinition[][] {
  return voxelArrays.map((voxels) => filterVoxelsByViewport(voxels, viewport));
}

/**
 * ズーム依存の詳細度を返す（0-3）
 * 詳細度が低いほど、より粗い表示
 */
export function getDetailLevel(zoom: number): number {
  if (zoom < 5) return 0;
  if (zoom < 10) return 1;
  if (zoom < 15) return 2;
  return 3;
}
