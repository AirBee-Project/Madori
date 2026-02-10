import { PureVoxel } from "../types/PureVoxel";
import { VoxelDefinition } from "../types/VoxelDefinition";

export default function hyperVoxelToPureVoxel(
  Voxels: VoxelDefinition[]
): PureVoxel[] {
  let result: PureVoxel[] = [];
  for (let i = 0; i < Voxels.length; i++) {
    let x: number[] = enumerateXRange(Voxels[i].X, Voxels[i].Z);
    let y: number[] = enumerateRange(Voxels[i].Y);
    let f: number[] = enumerateRange(Voxels[i].F);
    for (let xindex = 0; xindex < x.length; xindex++) {
      for (let yindex = 0; yindex < y.length; yindex++) {
        for (let findex = 0; findex < f.length; findex++) {
          result.push({
            Z: Voxels[i].Z,
            F: f[findex],
            X: x[xindex],
            Y: y[yindex],
          });
        }
      }
    }
  }
  //重複排除
  result = [...new Set(result)];

  console.log(result);
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
