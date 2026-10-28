import type { JsonLayerData } from "../../stores/jsonLayerStore";
import type { VoxelGeometry } from "../../types/geometry/spatioTemporalId/voxelGeometry";
import { spatialIdToRangeIds, voxelToGeometry } from "./voxelToGeometry";

export function jsonToGeometry(
  jsonLayer: JsonLayerData,
  rangeMode = true,
): VoxelGeometry[] {
  return jsonLayer.ids.flatMap((jsonId) =>
    spatialIdToRangeIds(jsonId, rangeMode).map((id) => ({
      ...voxelToGeometry(id, jsonId.color),
      value: jsonId.value,
    })),
  );
}
