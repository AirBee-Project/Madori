import type { KasaneId } from "../data/voxel-json";

/**
 * 時間範囲をパースして開始・終了時間のオブジェクトを返す
 */
export function parseTime(id: KasaneId): {
  startTime: number | null;
  endTime: number | null;
} {
  if (id.i === undefined || id.t === undefined) {
    return { startTime: null, endTime: null };
  }
  const interval = id.i;
  if (id.t.length === 1) {
    return { startTime: interval * id.t[0], endTime: interval * (id.t[0] + 1) };
  }
  const [t1, t2] = id.t;
  return { startTime: interval * t1, endTime: interval * (t2 + 1) };
}

/**
 * 基本の時空間IDに復元する関数
 */
export function toIdString(id: KasaneId): string {
  const z = id.z;
  const f = id.f
    ? id.f.length === 2
      ? `${id.f[0]}:${id.f[1]}`
      : `${id.f[0]}`
    : "-";
  const x = id.x
    ? id.x.length === 2
      ? `${id.x[0]}:${id.x[1]}`
      : `${id.x[0]}`
    : "-";
  const y = id.y
    ? id.y.length === 2
      ? `${id.y[0]}:${id.y[1]}`
      : `${id.y[0]}`
    : "-";

  const { startTime, endTime } = parseTime(id);
  const t =
    startTime !== null && endTime !== null ? `${startTime}:${endTime}` : "-";

  return `${z}/${f}/${x}/${y}/${t}`;
}
