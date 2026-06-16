import type { JsonLayerData, JsonSpatialId } from "../../stores/jsonLayerStore";
import { JsonFileSchema } from "../../types/json/jsonSchema";
import { createHeatmapColorScale } from "../color/heatmap";

//アップロードされたJSONファイルをJsonLayerData型に変換

/**
 * JSONの 1〜2 要素配列を SpatialId が扱う number | [number, number] に変換する
 * [n]      → n
 * [s, e]   → [s, e]
 */
function toIndexValue(arr: number[] | undefined): number | [number, number] {
  if (!arr || arr.length === 0) return 0;
  if (arr.length === 1) return arr[0];
  return [arr[0], arr[1]];
}

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
    const f = toIndexValue(idObj.f);
    const x = toIndexValue(idObj.x);
    const y = toIndexValue(idObj.y);

    let temporalId:
      | {
          i: number;
          t: number | [number, number];
        }
      | undefined;
    if (idObj.i !== undefined && idObj.t !== undefined) {
      temporalId = { i: idObj.i, t: toIndexValue(idObj.t) };
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
