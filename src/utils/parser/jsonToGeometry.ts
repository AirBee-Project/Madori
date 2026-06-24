import type { JsonLayerData } from "../../stores/jsonLayerStore";
import type { VoxelGeometry } from "../../types/geometry/spatioTemporalId/voxelGeometry";
import { spatialIdToVoxels } from "./spatialIdToVoxels";
import { voxelToGeometry } from "./voxelToGeometry";

//JsonLayerDataからVoxelGeometryに変換

export function jsonToGeometry(
  jsonLayer: JsonLayerData,
  rangeMode = true,
): VoxelGeometry[] {
  const result: VoxelGeometry[] = [];

  for (const jsonId of jsonLayer.ids) {
    // SpatialIdとしてvoxel生成
    const voxels = spatialIdToVoxels(jsonId, rangeMode);

    const color = jsonId.color;

    const geometries = voxels.map((voxel) => {
      const geom = voxelToGeometry(voxel, color);
      // ValueをGeometry に追加
      geom.value = jsonId.value;
      return geom;
    });

    result.push(...geometries);
  }

  return result;
}
