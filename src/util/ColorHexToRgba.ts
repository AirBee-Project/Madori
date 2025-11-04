export default function colorHexToRgba(
  hex: string,
  opacity: number
): [number, number, number, number] {
  // まず # を除去
  const cleanHex = hex.replace("#", "");

  // 6桁以外はエラーにする
  if (cleanHex.length !== 6) {
    return [255, 255, 255, 255];
  }

  // R, G, Bをそれぞれ取り出して10進数に変換
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // opacity (0〜100) を 0〜255 に変換
  const a = Math.round((opacity / 100) * 255);

  return [r, g, b, a];
}
