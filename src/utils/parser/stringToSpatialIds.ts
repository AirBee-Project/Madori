import { RangeId } from "@airbee-project/kasane-client";
import {
  fromRangeId,
  type SpatialId,
} from "../../types/geometry/spatioTemporalId";

export type StringToSpatialIdsError = { content: string; message: string };

export type StringToSpatialIdsResult = {
  success: SpatialId[];
  errors: StringToSpatialIdsError[];
};

/** カンマ区切りの空間IDの文字列を解析する */
export function stringToSpatialIds(target: string): StringToSpatialIdsResult {
  const result: StringToSpatialIdsResult = { success: [], errors: [] };
  for (const content of target.split(",").map((s) => s.trim())) {
    if (!content) continue;
    try {
      result.success.push(fromRangeId(RangeId.parse(content)));
    } catch (e) {
      result.errors.push({ content, message: (e as Error).message });
    }
  }
  return result;
}
