import { PureVoxel } from "../types/PureVoxel";
import { VoxelDefinition } from "../types/VoxelDefinition";

function toRange(item: [number, number] | number): [number, number] {
  if (typeof item === "number") return [item, item];
  return item;
}

function formatDim(item: [number, number] | number): string {
  if (typeof item === "number") return String(item);
  return `${item[0]}:${item[1]}`;
}

export default function hyperVoxelToPureVoxel(
  Voxels: VoxelDefinition[],
  compileMode: boolean = true,
): PureVoxel[] {
  if (compileMode) {
    return compileModeParse(Voxels);
  } else {
    return expandModeParse(Voxels);
  }
}

function compileModeParse(Voxels: VoxelDefinition[]): PureVoxel[] {
  let result: PureVoxel[] = [];

  for (let i = 0; i < Voxels.length; i++) {
    const v = Voxels[i];
    const [fMin, fMax] = toRange(v.F);
    const [yMin, yMax] = toRange(v.Y);
    const originalId = `${v.Z}/${formatDim(v.F)}/${formatDim(v.X)}/${formatDim(v.Y)}`;

    if (typeof v.X === "number") {
      result.push({
        Z: v.Z,
        X: v.X,
        X2: v.X,
        Y: yMin,
        Y2: yMax,
        F: fMin,
        F2: fMax,
        originalId,
        startTime: v.startTime,
        endTime: v.endTime,
      });
    } else {
      const [xStart, xEnd] = v.X;
      if (xStart <= xEnd) {
        result.push({
          Z: v.Z,
          X: xStart,
          X2: xEnd,
          Y: yMin,
          Y2: yMax,
          F: fMin,
          F2: fMax,
          originalId,
          startTime: v.startTime,
          endTime: v.endTime,
        });
      } else {
        const maxX = 2 ** v.Z - 1;
        result.push({
          Z: v.Z,
          X: xStart,
          X2: maxX,
          Y: yMin,
          Y2: yMax,
          F: fMin,
          F2: fMax,
          originalId,
          startTime: v.startTime,
          endTime: v.endTime,
        });
        result.push({
          Z: v.Z,
          X: 0,
          X2: xEnd,
          Y: yMin,
          Y2: yMax,
          F: fMin,
          F2: fMax,
          originalId,
          startTime: v.startTime,
          endTime: v.endTime,
        });
      }
    }
  }

  return result;
}

function expandModeParse(Voxels: VoxelDefinition[]): PureVoxel[] {
  let result: PureVoxel[] = [];

  for (let i = 0; i < Voxels.length; i++) {
    const v = Voxels[i];
    const xValues = enumerateXRange(v.X, v.Z);
    const yValues = enumerateRange(v.Y);
    const fValues = enumerateRange(v.F);

    for (const x of xValues) {
      for (const y of yValues) {
        for (const f of fValues) {
          result.push({
            Z: v.Z,
            X: x,
            X2: x,
            Y: y,
            Y2: y,
            F: f,
            F2: f,
            originalId: `${v.Z}/${f}/${x}/${y}`,
            startTime: v.startTime,
            endTime: v.endTime,
          });
        }
      }
    }
  }

  return result;
}

/**
 * 配列列挙結果のキャッシュ（メモ化）
 */
const enumerateCache = new Map<string, number[]>();
const enumerateXCache = new Map<string, number[]>();

function enumerateRange(item: [number, number] | number): number[] {
  const key =
    typeof item === "number" ? item.toString() : `${item[0]},${item[1]}`;

  if (enumerateCache.has(key)) {
    return enumerateCache.get(key)!;
  }

  let result: number[];
  if (typeof item === "number") {
    result = [item];
  } else {
    const [start, end] = [...item].sort((a, b) => a - b);
    result = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // キャッシュサイズ制限
  if (enumerateCache.size > 1000) {
    const firstKey = enumerateCache.keys().next().value;
    if (firstKey) enumerateCache.delete(firstKey);
  }

  enumerateCache.set(key, result);
  return result;
}

function enumerateXRange(
  item: [number, number] | number,
  zoomLevel: number,
): number[] {
  const key = `${typeof item === "number" ? item : `${item[0]},${item[1]}`}:z${zoomLevel}`;

  if (enumerateXCache.has(key)) {
    return enumerateXCache.get(key)!;
  }

  let result: number[];
  if (typeof item === "number") {
    result = [item];
  } else {
    const [start, end] = item;
    if (start <= end) {
      result = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    } else {
      const maxX = 2 ** zoomLevel;
      result = [];
      for (let x = start; x < maxX; x++) result.push(x);
      for (let x = 0; x <= end; x++) result.push(x);
    }
  }

  // キャッシュサイズ制限
  if (enumerateXCache.size > 1000) {
    const firstKey = enumerateXCache.keys().next().value;
    if (firstKey) enumerateXCache.delete(firstKey);
  }

  enumerateXCache.set(key, result);
  return result;
}
