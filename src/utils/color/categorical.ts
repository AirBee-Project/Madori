import type { RGBAColor } from "../../types/geometry/color";

const PALETTE: RGBAColor[] = [
  { r: 31, g: 119, b: 180, a: 200 },
  { r: 255, g: 127, b: 14, a: 200 },
  { r: 44, g: 160, b: 44, a: 200 },
  { r: 214, g: 39, b: 40, a: 200 },
  { r: 148, g: 103, b: 189, a: 200 },
  { r: 140, g: 86, b: 75, a: 200 },
  { r: 227, g: 119, b: 194, a: 200 },
  { r: 127, g: 127, b: 127, a: 200 },
  { r: 188, g: 189, b: 34, a: 200 },
  { r: 23, g: 190, b: 207, a: 200 },
];

/**
 * values に現れる値ごとに異なる色を割り当てる関数を作成する。
 * 値は文字列化して区別し、種類がパレットの色数を超えた場合は色を循環させる。
 */
export function createCategoricalColorScale<T>(
  values: T[],
): (value: T) => RGBAColor {
  const indexByKey = new Map<string, number>();
  for (const v of values) {
    const key = String(v);
    if (!indexByKey.has(key)) indexByKey.set(key, indexByKey.size);
  }

  return (value) =>
    PALETTE[(indexByKey.get(String(value)) ?? 0) % PALETTE.length];
}
