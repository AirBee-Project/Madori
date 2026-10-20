import { describe, expect, it } from "vitest";
import { createHeatmapColorScale } from "../color/heatmap";
import { jsonToSpatialIds } from "./jsonToSpatialIds";

function makeJson(value: unknown[]): string {
  return JSON.stringify({
    data: [
      {
        name: "test",
        value,
        ids: value.map((_, ref) => ({ z: 20, f: [0], x: [ref], y: [0], ref })),
      },
    ],
  });
}

describe("jsonToSpatialIds", () => {
  it("数値のみの value はヒートマップで色付けされること", () => {
    const result = jsonToSpatialIds(makeJson([1, 5, 10]));
    const scale = createHeatmapColorScale([1, 5, 10]);
    expect(result.ids.map((id) => id.color)).toEqual([
      scale(1),
      scale(5),
      scale(10),
    ]);
  });

  it("文字列と真偽値の value を読み込めること", () => {
    const result = jsonToSpatialIds(makeJson(["high", "low", true, 3]));
    expect(result.ids.map((id) => id.value)).toEqual(["high", "low", true, 3]);
  });

  it("同じ値には同じ色、異なる値には異なる色が割り当てられること", () => {
    const result = jsonToSpatialIds(makeJson(["a", "b", "a"]));
    const [a1, b, a2] = result.ids.map((id) => id.color);
    expect(a1).toEqual(a2);
    expect(a1).not.toEqual(b);
  });

  it("null やオブジェクトの value はエラーになること", () => {
    expect(() => jsonToSpatialIds(makeJson([null]))).toThrow();
    expect(() => jsonToSpatialIds(makeJson([{ a: 1 }]))).toThrow();
  });
});
