import { describe, expect, it } from "vitest";
import { jsonToGraph } from "./jsonToGraph";

describe("jsonToGraph", () => {
  it("正常なグラフJSONをパースできる", () => {
    const json = JSON.stringify({
      nodes: {
        a: { latitude: 35.681, longitude: 139.767, altitude: 0 },
        b: { latitude: 35.691, longitude: 139.787, altitude: 10 },
      },
      adjacency: {
        a: [{ node: "b", cost: 1.5, risk: 0.2 }],
        b: [{ node: "a", cost: 1.5, risk: 0.2 }],
      },
    });

    const result = jsonToGraph(json);
    expect(Object.keys(result.nodes)).toEqual(["a", "b"]);
    expect(result.adjacency.a[0]).toEqual({ node: "b", cost: 1.5, risk: 0.2 });
  });

  it("nodesが空の場合はエラーを投げる", () => {
    const json = JSON.stringify({ nodes: {}, adjacency: {} });
    expect(() => jsonToGraph(json)).toThrow("nodesが空です。");
  });

  it("adjacencyが存在しないノードIDをキーに持つ場合はエラーを投げる", () => {
    const json = JSON.stringify({
      nodes: { a: { latitude: 35.681, longitude: 139.767, altitude: 0 } },
      adjacency: {
        unknown: [{ node: "a", cost: 1, risk: 0 }],
      },
    });
    expect(() => jsonToGraph(json)).toThrow(/adjacencyに存在しないノードID/);
  });

  it("エッジが存在しないノードIDを参照する場合はエラーを投げる", () => {
    const json = JSON.stringify({
      nodes: { a: { latitude: 35.681, longitude: 139.767, altitude: 0 } },
      adjacency: {
        a: [{ node: "unknown", cost: 1, risk: 0 }],
      },
    });
    expect(() => jsonToGraph(json)).toThrow(/nodesに存在しません/);
  });

  it("緯度が範囲外の場合はエラーを投げる", () => {
    const json = JSON.stringify({
      nodes: { a: { latitude: 90, longitude: 139.767, altitude: 0 } },
      adjacency: {},
    });
    expect(() => jsonToGraph(json)).toThrow();
  });
});
