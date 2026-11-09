import { useEmbedStore } from "../stores/embedStore";
import { useJsonLayerStore } from "../stores/jsonLayerStore";
import { useMapStore } from "../stores/mapStore";
import { useSpatialIdGroupStore } from "../stores/spatialIdGroupStores";
import { useTimeStore } from "../stores/timeStore";
import type { RGBAColor } from "../types/geometry/color";
import type { VoxelGeometry } from "../types/geometry/spatioTemporalId/voxelGeometry";
import { calculateVoxelFocus } from "./focusHelper";
import { jsonToGeometry } from "./parser/jsonToGeometry";
import { jsonToSpatialIds } from "./parser/jsonToSpatialIds";
import { stringToSpatialIds } from "./parser/stringToSpatialIds";
import { spatialIdGroupToGeometries } from "./parser/voxelToGeometry";

const COLORS: RGBAColor[] = [
  { r: 15, g: 118, b: 110, a: 128 },
  { r: 236, g: 72, b: 153, a: 128 },
  { r: 59, g: 130, b: 246, a: 128 },
  { r: 245, g: 158, b: 11, a: 128 },
  { r: 139, g: 92, b: 246, a: 128 },
];

/** 指定しなかった項目は、中心とズームは表示する ID から、方位・傾きは 0（北が上、真上から） */
export type Camera = {
  longitude?: number;
  latitude?: number;
  bearing?: number;
  pitch?: number;
  zoom?: number;
};

/** ids は 1 要素が 1 グループ（カンマ区切りの空間ID） */
export type EmbedData = {
  ids?: string[];
  json?: string;
  border?: boolean;
  camera?: Camera;
};

/** 表示中の ID と JSON を置き換え、その場所へカメラを動かす */
export function show({ ids = [], json, border, camera = {} }: EmbedData): void {
  const groups = useSpatialIdGroupStore.getState();
  for (const id of groups.spatialIdGroups.keys())
    groups.removeSpatialIdGroup(id);
  if (border !== undefined && border !== groups.showBorder)
    groups.toggleBorder();

  const geometries: VoxelGeometry[] = [];
  ids.forEach((text, i) => {
    const color = COLORS[i % COLORS.length];
    const { success: spatialIds } = stringToSpatialIds(text);
    groups.addSpatialIdGroup({ color, spatialIds });
    geometries.push(
      ...spatialIdGroupToGeometries({ id: "", color, spatialIds }),
    );
  });

  const data = json ? jsonToSpatialIds(json) : null;
  useJsonLayerStore.getState().setData(data);
  if (data) geometries.push(...jsonToGeometry(data));

  if (geometries.length === 0) {
    useEmbedStore.getState().setHasTime(false);
    return;
  }
  const target = calculateVoxelFocus(geometries);
  useEmbedStore.getState().setHasTime(target.minStartTime !== null);
  // 高さも画面に入るようにする（緯度 1 度 ≒ 111 km）
  const top = geometries.reduce(
    (m, g) => Math.max(m, g.altitude + g.elevation),
    0,
  );
  const zoomForHeight = Math.floor(
    Math.log2((360 * 111_320) / Math.max(top, 1)),
  );
  // まわりも見えるよう引く。粗い ID は高さが数千 km になるので、さらに引く
  const coarse = target.zoom < 8;
  // 地図の準備前に呼ばれるとアニメーション（flyTo）が無視されるので、アニメーションせずに視点を置く
  const map = useMapStore.getState();
  map.setViewState({
    ...map.viewState,
    longitude: camera.longitude ?? target.longitude,
    latitude: camera.latitude ?? target.latitude,
    zoom:
      camera.zoom ??
      Math.max(Math.min(target.zoom, zoomForHeight) - (coarse ? 2 : 1.25), 0),
    pitch: camera.pitch ?? 0,
    bearing: camera.bearing ?? 0,
    transitionDuration: 0,
  });
  if (target.minStartTime !== null) {
    useTimeStore.getState().setCurrentTime(target.minStartTime);
  }
}

/** URL の数値*/
function numberParam(params: URLSearchParams, name: string) {
  const value = Number(params.get(name) || Number.NaN);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * URL（?ids=…&ids=…&border）で受け取った ID を表示する。
 * ?longitude・?latitude（中心）・?bearing（方位、度）・?pitch（傾き、度）・?zoom（ズームレベル）でカメラを指定できる。
 * ?view を付けるとボタン類を隠し、?hover を付けるとカーソルを乗せたボクセルの ID と値を最初から表示する。
 * 埋め込み元のページからは postMessage（{ type: "madori:show", ...EmbedData }）でも渡せる
 */
export function startEmbed(): void {
  const params = new URLSearchParams(window.location.search);
  const groups = useSpatialIdGroupStore.getState();
  if (params.has("hover") && !groups.pickable) groups.togglePicking();
  if (useEmbedStore.getState().viewOnly && !groups.showBorder)
    groups.toggleBorder();
  if (params.has("ids")) {
    // border を付けないときは、今の枠線の表示（view なら表示）のままにする
    show({
      ids: params.getAll("ids"),
      border: params.has("border") || undefined,
      camera: {
        longitude: numberParam(params, "longitude"),
        latitude: numberParam(params, "latitude"),
        bearing: numberParam(params, "bearing"),
        pitch: numberParam(params, "pitch"),
        zoom: numberParam(params, "zoom"),
      },
    });
  }
  window.addEventListener("message", (e: MessageEvent) => {
    if (e.data?.type === "madori:show") show(e.data);
  });
  window.parent.postMessage({ type: "madori:ready" }, "*");
}
