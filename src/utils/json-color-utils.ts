import { preset_colors } from "../data/colors";

/**
 * 配列の中身のプリミティブ値判定関数
 */
export function isPrimitiveArray(values: unknown[]): boolean {
  return values.every(
    (v) =>
      typeof v === "string" || typeof v === "number" || typeof v === "boolean",
  );
}

/**
 * 配列の中から重複を消す関数、
 */
export function uniqueValues(values: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const v of values) {
    const s = String(v);
    if (!seen.has(s)) {
      seen.add(s);
      result.push(s);
    }
  }
  return result;
}

/**
 * 16進数のカラーコードをRGBA形式の配列に変換する関数
 */
export function hexToRgba(
  hex: string,
  alpha: number,
): [number, number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return [r, g, b, alpha];
}

/**
 * valueに対して初期の色を割り振る関数
 */
export function buildInitialColorMap(
  values: string[],
): Map<string, [number, number, number, number]> {
  const map = new Map<string, [number, number, number, number]>();
  for (let i = 0; i < values.length; i++) {
    map.set(values[i], hexToRgba(preset_colors[i % preset_colors.length], 200));
  }
  return map;
}
