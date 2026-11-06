import {
  type FileHandleLike,
  fileFormatOf,
  setFileHandle,
} from "../../stores/fileHandles";
import { useJsonLayerStore } from "../../stores/jsonLayerStore";
import { useSpatialIdGroupStore } from "../../stores/spatialIdGroupStores";
import type { RGBAColor } from "../../types/geometry/color";
import { jsonToSpatialIds } from "../../utils/parser/jsonToSpatialIds";
import { stringToSpatialIds } from "../../utils/parser/stringToSpatialIds";

export const DEFAULT_SPATIAL_ID_COLOR: RGBAColor = {
  r: 15,
  g: 118,
  b: 110,
  a: 128,
};

function addTextGroup(content: string): string | null {
  const store = useSpatialIdGroupStore.getState();
  // addSpatialIdGroup は ID を返さないので、追加前後のキーの差分で特定する
  const before = new Set(store.spatialIdGroups.keys());
  const result = store.addSpatialIdGroup({
    color: DEFAULT_SPATIAL_ID_COLOR,
    spatialIds: stringToSpatialIds(content).success,
  });
  if (!result.success) return null;
  const after = useSpatialIdGroupStore.getState().spatialIdGroups.keys();
  return Array.from(after).find((key) => !before.has(key)) ?? null;
}

/**
 * .txt は空間IDグループ、.json は JSON レイヤーとして追加し、再読み込み用にハンドルを残す
 */
export async function loadSpatialIdFile(handle: FileHandleLike): Promise<void> {
  const format = fileFormatOf(handle.name);
  if (!format) {
    throw new Error(
      `${handle.name}: .txt か .json のファイルを選んでください。`,
    );
  }
  const content = await (await handle.getFile()).text();
  const id =
    format === "json"
      ? useJsonLayerStore.getState().addJsonLayer(jsonToSpatialIds(content))
      : addTextGroup(content);
  if (id) setFileHandle(id, handle);
}
