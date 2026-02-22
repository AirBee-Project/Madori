import { PureVoxel } from "../data/expanded-voxel";
import { VoxelDefinition } from "../data/voxel-definition";

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
  compileMode: boolean = true
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
        Z: v.Z, X: v.X, X2: v.X, Y: yMin, Y2: yMax, F: fMin, F2: fMax,
        originalId,
        startTime: v.startTime,
        endTime: v.endTime,
      });
    } else {
      const [xStart, xEnd] = v.X;
      if (xStart <= xEnd) {
        result.push({
          Z: v.Z, X: xStart, X2: xEnd, Y: yMin, Y2: yMax, F: fMin, F2: fMax,
          originalId,
          startTime: v.startTime,
          endTime: v.endTime,
        });
      } else {
        const maxX = 2 ** v.Z - 1;
        result.push({
          Z: v.Z, X: xStart, X2: maxX, Y: yMin, Y2: yMax, F: fMin, F2: fMax,
          originalId,
          startTime: v.startTime,
          endTime: v.endTime,
        });
        result.push({
          Z: v.Z, X: 0, X2: xEnd, Y: yMin, Y2: yMax, F: fMin, F2: fMax,
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
            Z: v.Z, X: x, X2: x, Y: y, Y2: y, F: f, F2: f,
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

function enumerateRange(item: [number, number] | number): number[] {
  if (typeof item === "number") return [item];
  const [start, end] = [...item].sort((a, b) => a - b);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function enumerateXRange(item: [number, number] | number, zoomLevel: number): number[] {
  if (typeof item === "number") return [item];
  const [start, end] = item;
  if (start <= end) {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  const maxX = 2 ** zoomLevel;
  const result: number[] = [];
  for (let x = start; x < maxX; x++) result.push(x);
  for (let x = 0; x <= end; x++) result.push(x);
  return result;
}
