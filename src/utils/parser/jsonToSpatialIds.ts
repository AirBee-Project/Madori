import type { JsonLayerData, JsonSpatialId } from "../../stores/jsonLayerStore";
import { JsonFileSchema } from "../../types/json/jsonSchema";
import { createHeatmapColorScale } from "../color/heatmap";

//アップロードされたJSONファイルをJsonLayerData型に変換

export function jsonToSpatialIds(jsonString: string): JsonLayerData {
  const parsed = JSON.parse(jsonString);
  const validated = JsonFileSchema.parse(parsed);

  if (validated.data.length === 0) {
    throw new Error("JSONの data 配列が空です。");
  }

  // 1つ目のデータのみ使用
  const firstData = validated.data[0];
  const colorScale = createHeatmapColorScale(firstData.value);

  const jsonSpatialIds: JsonSpatialId[] = firstData.ids.map((idObj) => {
    const f = idObj.f ?? 0;
    const x = idObj.x ?? 0;
    const y = idObj.y ?? 0;

    let temporalId:
      | {
          i: number;
          t: number | [number, number];
        }
      | undefined;
    if (idObj.i !== undefined && idObj.t !== undefined) {
      temporalId = { i: idObj.i, t: idObj.t };
    }

    // SpatialIdの形式に変換
    const spatialIdRaw = {
      z: idObj.z,
      f,
      x,
      y,
      temporalId,
    };

    if (idObj.ref < 0 || idObj.ref >= firstData.value.length) {
      throw new Error(
        `参照ID (ref: ${idObj.ref}) が values 配列の範囲外です。`,
      );
    }
    const refValue = firstData.value[idObj.ref];
    const color = colorScale(refValue);

    return {
      ...spatialIdRaw,
      ref: idObj.ref,
      value: refValue,
      color,
    };
  });

  return {
    meta: validated.meta,
    name: firstData.name,
    values: firstData.value,
    ids: jsonSpatialIds,
  };
}
