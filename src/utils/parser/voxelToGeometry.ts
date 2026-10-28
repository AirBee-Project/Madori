import type { RangeId } from "@airbee-project/kasane-client";
import type { RGBAColor } from "../../types/geometry/color";
import {
  type SpatialId,
  toRangeId,
} from "../../types/geometry/spatioTemporalId";
import type { SpatialIdGroup } from "../../types/geometry/spatioTemporalId/spatialIdGroup";
import type { VoxelGeometry } from "../../types/geometry/spatioTemporalId/voxelGeometry";

/**
 * 描画する単位に分ける。rangeMode では範囲のまま（経度 180 度をまたぐ x は 2 つに分ける）、
 * そうでなければ 1 ボクセルずつにする
 */
export function spatialIdToRangeIds(
  spatialId: SpatialId,
  rangeMode = true,
): RangeId[] {
  const id = toRangeId(spatialId);
  if (!rangeMode) return [...id.toSingleIds()].map((s) => s.toRangeId());
  const [start, end] = id.x;
  if (start <= end) return [id];
  return [
    { ...spatialId, x: [start, 2 ** id.z - 1] as [number, number] },
    { ...spatialId, x: [0, end] as [number, number] },
  ].map(toRangeId);
}

export function voxelToGeometry(id: RangeId, color: RGBAColor): VoxelGeometry {
  const { latitude, longitude, altitude } = id.toCoordinateRange();
  const [south, north] = latitude;
  const [west, east] = longitude;
  const [bottom, top] = altitude;
  const [startTime, endTime] = id.isWholeTime()
    ? [null, null]
    : id.secondsRange();
  return {
    points: [
      [east, north, bottom],
      [west, north, bottom],
      [west, south, bottom],
      [east, south, bottom],
      [east, north, bottom],
    ],
    altitude: bottom,
    elevation: top - bottom,
    voxelId: id.toString(),
    color,
    startTime,
    endTime,
  };
}

const geometryCache = new Map<string, VoxelGeometry[]>();

export function spatialIdGroupToGeometries(
  group: SpatialIdGroup,
  rangeMode = true,
): VoxelGeometry[] {
  return group.spatialIds.flatMap((spatialId) => {
    const key = `${toRangeId(spatialId)}_${rangeMode}`;
    let geometries = geometryCache.get(key);
    if (!geometries) {
      geometries = spatialIdToRangeIds(spatialId, rangeMode).map((id) =>
        voxelToGeometry(id, group.color),
      );
      geometryCache.set(key, geometries);
    }
    // キャッシュは色が古いことがあるので上書きする
    return geometries.map((geom) => ({ ...geom, color: group.color }));
  });
}
