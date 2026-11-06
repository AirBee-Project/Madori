import {
  RangeId,
  type SpatialId,
} from "@airbee-project/kasane-client/spatial-id";
import type { RGBAColor } from "../../types/geometry/color";
import type { SpatialIdGroup } from "../../types/geometry/spatioTemporalId/spatialIdGroup";
import type { VoxelGeometry } from "../../types/geometry/spatioTemporalId/voxelGeometry";

/**
 * 描画する単位に分ける。rangeMode では範囲のまま（経度 180 度をまたぐ x は 2 つに分ける）、
 * そうでなければ 1 ボクセルずつにする
 */
export function splitForDrawing(id: RangeId, rangeMode = true): SpatialId[] {
  if (!rangeMode) return [...id.singleIds()];
  const [start, end] = id.x;
  if (start <= end) return [id];
  // 西端 > 東端のままでは頂点から経度の範囲を作れない
  const part = (x: [number, number]) => {
    const range = RangeId.create(id.z, id.f, x, id.y);
    return id.timeIsWhole() ? range : range.timeWith(id.i, id.t);
  };
  return [part([start, 2 ** id.z - 1]), part([0, end])];
}

export function voxelToGeometry(
  id: SpatialId,
  color: RGBAColor,
): VoxelGeometry {
  // 頂点は高度・緯度（y が小さい方が北）・経度の昇順に並ぶ
  const [nw, ne, sw, , nwTop] = id.spatialVertices();
  const [west, east] = [nw.longitude, ne.longitude];
  const [north, south] = [nw.latitude, sw.latitude];
  const [bottom, top] = [nw.altitude, nwTop.altitude];
  const [startTime, endTime] = id.timeIsWhole() ? [null, null] : id.timeRange();
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
    const key = `${spatialId}_${rangeMode}`;
    let geometries = geometryCache.get(key);
    if (!geometries) {
      geometries = splitForDrawing(spatialId, rangeMode).map((id) =>
        voxelToGeometry(id, group.color),
      );
      geometryCache.set(key, geometries);
    }
    // キャッシュは色が古いことがあるので上書きする
    return geometries.map((geom) => ({ ...geom, color: group.color }));
  });
}
