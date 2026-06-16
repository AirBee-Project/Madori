import type { RGBAColor } from "../../types/geometry/color";
import type { SpatialId } from "../../types/geometry/spatioTemporalId";
import type { SpatialIdGroup } from "../../types/geometry/spatioTemporalId/spatialIdGroup";
import type { VoxelGeometry } from "../../types/geometry/spatioTemporalId/voxelGeometry";
import { type SpatialVoxel, spatialIdToVoxels } from "./spatialIdToVoxels";

/**
 * タグ用のID作成
 */
export function voxelToIdString(voxel: SpatialVoxel): string {
  const axisRangeToString = (min: number, max: number): string => {
    return min === max ? String(min) : `${min}:${max}`;
  };

  const fStr = axisRangeToString(voxel.fMin, voxel.fMax);
  const xStr = axisRangeToString(voxel.xMin, voxel.xMax);
  const yStr = axisRangeToString(voxel.yMin, voxel.yMax);
  const spatialStr = `${voxel.z}/${fStr}/${xStr}/${yStr}`;

  if (!voxel.temporalId) {
    return spatialStr;
  }

  const tStr = axisRangeToString(voxel.temporalId.tMin, voxel.temporalId.tMax);
  return `${spatialStr}_${voxel.temporalId.i}/${tStr}`;
}

/**
 * ボクセルから座標へ変換
 */
export function voxelToGeometry(
  voxel: SpatialVoxel,
  color: RGBAColor,
): VoxelGeometry {
  const n = 2 ** voxel.z;
  const lonPerTile = 360 / n;

  const minLon = -180 + lonPerTile * voxel.xMin;
  const maxLon = -180 + lonPerTile * (voxel.xMax + 1);

  const maxLat =
    (Math.atan(Math.sinh(Math.PI - (voxel.yMin / n) * 2 * Math.PI)) * 180) /
    Math.PI;
  const minLat =
    (Math.atan(Math.sinh(Math.PI - ((voxel.yMax + 1) / n) * 2 * Math.PI)) *
      180) /
    Math.PI;

  const resolution = 33554432 / n;
  const altitude = resolution * voxel.fMin;
  const elevation = resolution * (voxel.fMax - voxel.fMin + 1);

  const points: [number, number, number][] = [
    [maxLon, maxLat, altitude],
    [minLon, maxLat, altitude],
    [minLon, minLat, altitude],
    [maxLon, minLat, altitude],
    [maxLon, maxLat, altitude],
  ];

  let startTime: number | null = null;
  let endTime: number | null = null;

  if (voxel.temporalId) {
    const { i, tMin, tMax } = voxel.temporalId;
    startTime = tMin * i;
    endTime = (tMax + 1) * i;
  }

  const voxelId = voxelToIdString(voxel);

  return {
    points,
    altitude,
    elevation,
    voxelId,
    color,
    startTime,
    endTime,
  };
}

const geometryCache = new Map<string, VoxelGeometry[]>();

/**
 * キャッシュ用の文字列作成
 */
function getSpatialIdCacheKey(
  spatialId: SpatialId,
  rangeMode: boolean,
): string {
  const serializeVal = (val: number | [number, number]): string => {
    return typeof val === "number" ? String(val) : `${val[0]}:${val[1]}`;
  };
  const fStr = serializeVal(spatialId.f);
  const xStr = serializeVal(spatialId.x);
  const yStr = serializeVal(spatialId.y);
  const spatialStr = `${spatialId.z}/${fStr}/${xStr}/${yStr}`;

  if (!spatialId.temporalId) {
    return `${spatialStr}_${rangeMode}`;
  }
  const tStr = serializeVal(spatialId.temporalId.t);
  return `${spatialStr}_${spatialId.temporalId.i}/${tStr}_${rangeMode}`;
}

/**
 *座標をリスト化
 */
export function spatialIdGroupToGeometries(
  group: SpatialIdGroup,
  rangeMode = true,
): VoxelGeometry[] {
  const result: VoxelGeometry[] = [];
  for (const spatialId of group.spatialIds) {
    const key = getSpatialIdCacheKey(spatialId, rangeMode);
    const cached = geometryCache.get(key);
    //キャッシュにデータがあった場合、色だけ上書きする
    if (cached) {
      for (const geom of cached) {
        result.push({ ...geom, color: group.color });
      }
      continue;
    }
    const voxels = spatialIdToVoxels(spatialId, rangeMode);
    const geometries = voxels.map((voxel) =>
      voxelToGeometry(voxel, group.color),
    );

    geometryCache.set(key, geometries);
    for (const geom of geometries) {
      result.push(geom);
    }
  }
  return result;
}
