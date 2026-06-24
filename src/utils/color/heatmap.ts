import type { RGBAColor } from "../../types/geometry/color";

type ColorConverter = (value: number) => RGBAColor;

/**
 * valueに色を割り当てる関数の作成用関数
 */
export function createHeatmapColorScale(values: number[]): ColorConverter {
  // 空データの場合は青を返す
  if (values.length === 0) {
    function fallbackBlue(_value: number): RGBAColor {
      return { r: 0, g: 0, b: 255, a: 255 };
    }
    return fallbackBlue;
  }

  // valueの最小値と最大値を探す
  let min = values[0];
  let max = values[0];
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  // valueの値がすべて同じ場合赤を返す
  if (min === max) {
    function fallbackRed(_value: number): RGBAColor {
      return { r: 255, g: 0, b: 0, a: 255 };
    }
    return fallbackRed;
  }

  // valueに色を割り当てる関数
  function convertValueToColor(value: number): RGBAColor {
    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));

    // HSLで色計算
    const h = (1 - ratio) * 240;
    const s = 1.0;
    const l = 0.5;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r1 = 0;
    let g1 = 0;
    let b1 = 0;

    if (h >= 0 && h < 60) {
      r1 = c;
      g1 = x;
      b1 = 0;
    } else if (h >= 60 && h < 120) {
      r1 = x;
      g1 = c;
      b1 = 0;
    } else if (h >= 120 && h < 180) {
      r1 = 0;
      g1 = c;
      b1 = x;
    } else if (h >= 180 && h <= 240) {
      r1 = 0;
      g1 = x;
      b1 = c;
    }

    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255),
      a: 255,
    };
  }

  return convertValueToColor;
}
