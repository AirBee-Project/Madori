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
  Voxels: VoxelDefinition[]
): PureVoxel[] {
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
      });
    } else {
      const [xStart, xEnd] = v.X;
      if (xStart <= xEnd) {
        result.push({
          Z: v.Z, X: xStart, X2: xEnd, Y: yMin, Y2: yMax, F: fMin, F2: fMax,
          originalId,
        });
      } else {
        const maxX = 2 ** v.Z - 1;
        result.push({
          Z: v.Z, X: xStart, X2: maxX, Y: yMin, Y2: yMax, F: fMin, F2: fMax,
          originalId,
        });
        result.push({
          Z: v.Z, X: 0, X2: xEnd, Y: yMin, Y2: yMax, F: fMin, F2: fMax,
          originalId,
        });
      }
    }
  }

  return result;
}
