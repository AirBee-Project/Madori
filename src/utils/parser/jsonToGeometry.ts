import type { JsonLayerData } from "../../stores/jsonLayerStore";
import type { VoxelGeometry } from "../../types/geometry/spatioTemporalId/voxelGeometry";
import { splitForDrawing, voxelToGeometry } from "./voxelToGeometry";

export function jsonToGeometry(
  jsonLayer: JsonLayerData,
  rangeMode = true,
): VoxelGeometry[] {
  return jsonLayer.ids.flatMap((jsonId) =>
    splitForDrawing(jsonId.id, rangeMode).map((id) => ({
      ...voxelToGeometry(id, jsonId.color),
      value: jsonId.value,
    })),
  );
}
