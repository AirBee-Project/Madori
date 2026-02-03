import { PureVoxel } from "../types/PureVoxel";
import { VoxelDefinition } from "../types/VoxelDefinition";

export default function hyperVoxelToPureVoxel(
  Voxels: VoxelDefinition[]
): PureVoxel[] {
  let result: PureVoxel[] = [];
  for (let i = 0; i < Voxels.length; i++) {
    let x: number[] = enumerateRange(Voxels[i].X);
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
  //重複排除は行わない（Setの最大サイズ制限回避のため）
  //また、生成ロジック上重複がない場合は不要であり、ある場合でも一旦パフォーマンス優先で削除
  //result = [...new Set(result)];


  return result;
}

function enumerateRange(item: [number, number] | number): number[] {
  if (typeof item === "number") return [item];

  const [start, end] = [...item].sort((a, b) => a - b);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
