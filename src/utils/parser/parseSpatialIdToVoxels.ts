import type { SpatialId } from "../../types/geometry/spatioTemporalId";
import { fxy_max } from "../../types/geometry/spatioTemporalId/spatialId";

export interface SpatialVoxel {
  z: number;
  fMin: number;
  fMax: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  temporalId?: {
    i: number;
    tMin: number;
    tMax: number;
  };
}

/**
 * 範囲表現に統一
 */
function toRange(item: number | [number, number]): [number, number] {
  if (typeof item === "number") return [item, item];
  const [start, end] = item;
  return start <= end ? [start, end] : [end, start];
}

/**
 * F,Y,Tの範囲表現の展開
 */
function expandRange(item: number | [number, number]): number[] {
  if (typeof item === "number") return [item];
  const [start, end] = item;
  const [min, max] = start <= end ? [start, end] : [end, start];
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

/**
 * Xの範囲表現の展開
 */
function expandXRange(item: number | [number, number], z: number): number[] {
  if (typeof item === "number") return [item];
  const [start, end] = item;

  if (start <= end) {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  const maxXVal = fxy_max[z];
  const result: number[] = [];
  for (let x = start; x <= maxXVal; x++) result.push(x);
  for (let x = 0; x <= end; x++) result.push(x);
  return result;
}

/**
 * 範囲ボクセルに変換
 */
function parseAsRangeVoxels(spatialId: SpatialId): SpatialVoxel[] {
  const { z, f, x, y, temporalId } = spatialId;

  const [fMin, fMax] = toRange(f);
  const [yMin, yMax] = toRange(y);

  let tRange: { i: number; tMin: number; tMax: number } | undefined;
  if (temporalId) {
    const [tMin, tMax] = toRange(temporalId.t);
    tRange = { i: temporalId.i, tMin, tMax };
  }

  // Xの回り込みがない場合
  if (typeof x === "number" || x[0] <= x[1]) {
    const [xMin, xMax] = toRange(x);
    return [
      {
        z,
        fMin,
        fMax,
        xMin,
        xMax,
        yMin,
        yMax,
        temporalId: tRange,
      },
    ];
  }

  // Xが回り込んでいる場合
  const [xStart, xEnd] = x;
  const maxXIndex = fxy_max[z];

  return [
    {
      z,
      fMin,
      fMax,
      xMin: xStart,
      xMax: maxXIndex,
      yMin,
      yMax,
      temporalId: tRange,
    },
    {
      z,
      fMin,
      fMax,
      xMin: 0,
      xMax: xEnd,
      yMin,
      yMax,
      temporalId: tRange,
    },
  ];
}

/**
 * 展開用ヘルパー関数
 */
function createSingleVoxel(
  z: number,
  f: number,
  x: number,
  y: number,
  iVal: number | undefined,
  tVal: number | null,
): SpatialVoxel {
  const voxel: SpatialVoxel = {
    z,
    fMin: f,
    fMax: f,
    xMin: x,
    xMax: x,
    yMin: y,
    yMax: y,
  };

  if (iVal !== undefined && tVal !== null) {
    voxel.temporalId = {
      i: iVal,
      tMin: tVal,
      tMax: tVal,
    };
  }

  return voxel;
}

/**
 * 展開用ヘルパー関数
 */
function generateSingleVoxels(
  z: number,
  fValues: number[],
  xValues: number[],
  yValues: number[],
  tValues: (number | null)[],
  iVal: number | undefined,
): SpatialVoxel[] {
  const result: SpatialVoxel[] = [];
  for (const f of fValues) {
    for (const x of xValues) {
      for (const y of yValues) {
        for (const t of tValues) {
          result.push(createSingleVoxel(z, f, x, y, iVal, t));
        }
      }
    }
  }
  return result;
}

/**
 * 個別ボクセルに変換
 */
function parseAsSingleVoxels(spatialId: SpatialId): SpatialVoxel[] {
  const { z, f, x, y, temporalId } = spatialId;

  const fValues = expandRange(f);
  const xValues = expandXRange(x, z);
  const yValues = expandRange(y);
  const tValues = temporalId ? expandRange(temporalId.t) : [null];

  return generateSingleVoxels(
    z,
    fValues,
    xValues,
    yValues,
    tValues,
    temporalId?.i,
  );
}

/**
 * IDから個別ボクセルまたは範囲ボクセルに変換
 */
export function parseSpatialIdToVoxels(
  spatialId: SpatialId,
  rangeMode = true,
): SpatialVoxel[] {
  if (rangeMode) {
    return parseAsRangeVoxels(spatialId);
  }
  return parseAsSingleVoxels(spatialId);
}
