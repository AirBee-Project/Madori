import type { Color } from "deck.gl";

/**
 * Deck.glのColor型または[number, number, number, number]型をrgba文字列に変換する関数
 */
export function rgbaCss(c: Color | [number, number, number, number]): string {
  if (Array.isArray(c)) {
    const [r, g, b, a = 255] = c;
    return `rgba(${r},${g},${b},${a / 255})`;
  }
  return String(c);
}
