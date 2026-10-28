import type { Deck } from "@deck.gl/core";
import type { Map as MaplibreMap } from "maplibre-gl";

/**
 * @description ベースマップとdeck.glの描画結果だけを1枚のPNGに合成して保存する。DOMのUIは含まれない。
 */
export function saveMapScreenshot(deck: Deck, map: MaplibreMap): Promise<void> {
  return new Promise((resolve, reject) => {
    // preserveDrawingBuffer なしでも読めるよう、描画直後の同じタスク内で両キャンバスを写す
    map.once("render", () => {
      const mapCanvas = map.getCanvas();
      const output = document.createElement("canvas");
      output.width = mapCanvas.width;
      output.height = mapCanvas.height;
      const ctx = output.getContext("2d");
      if (!ctx) {
        reject(new Error("2D context is unavailable"));
        return;
      }
      ctx.drawImage(mapCanvas, 0, 0);

      deck.redraw("screenshot");
      const deckCanvas = deck.getCanvas();
      // useDevicePixels={false} のため deck 側は解像度が低いことがあり、地図に合わせて引き伸ばす
      if (deckCanvas)
        ctx.drawImage(deckCanvas, 0, 0, output.width, output.height);

      output.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to encode screenshot"));
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `madori-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
        link.click();
        URL.revokeObjectURL(url);
        resolve();
      }, "image/png");
    });
    map.triggerRepaint();
  });
}
