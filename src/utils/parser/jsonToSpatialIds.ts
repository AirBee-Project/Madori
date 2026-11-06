import { RangeId } from "@airbee-project/kasane-client/spatial-id";
import type { JsonLayerData, JsonSpatialId } from "../../stores/jsonLayerStore";
import {
  JsonFileSchema,
  type JsonValueType,
} from "../../types/json/jsonSchema";
import { createCategoricalColorScale } from "../color/categorical";
import { createHeatmapColorScale } from "../color/heatmap";

//アップロードされたJSONファイルをJsonLayerData型に変換

/**
 * JSONの 1〜2 要素配列を RangeId が扱う number | [number, number] に変換する
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
  const numericValues = firstData.value.filter(
    (v): v is number => typeof v === "number",
  );
  const heatmapScale = createHeatmapColorScale(numericValues);
  const categoricalScale = createCategoricalColorScale(firstData.value);
  // 数値以外が 1 つでも混ざると大小関係で色を決められないため、値ごとの色分けにする
  const colorScale = (value: JsonValueType) =>
    numericValues.length === firstData.value.length && typeof value === "number"
      ? heatmapScale(value)
      : categoricalScale(value);

  const jsonSpatialIds: JsonSpatialId[] = firstData.ids.map((idObj) => {
    const f = toIndexValue(idObj.f);
    const x = toIndexValue(idObj.x);
    const y = toIndexValue(idObj.y);

    const rangeId = RangeId.create(idObj.z, f, x, y);
    const id =
      idObj.i !== undefined && idObj.t !== undefined
        ? rangeId.timeWith(idObj.i, toIndexValue(idObj.t))
        : rangeId;

    if (idObj.ref < 0 || idObj.ref >= firstData.value.length) {
      throw new Error(
        `参照ID (ref: ${idObj.ref}) が values 配列の範囲外です。`,
      );
    }
    const refValue = firstData.value[idObj.ref];
    const color = colorScale(refValue);

    return {
      id,
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
