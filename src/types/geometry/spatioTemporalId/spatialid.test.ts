import { describe, expect, it } from "vitest";
import { fromRangeId, SpatialIdSchema, toRangeId } from "./spatialId";

describe("SpatialIdSchema", () => {
  it("単一の値・範囲・時間を受け付ける", () => {
    const id = {
      z: 20,
      f: [0, 7],
      x: 931389,
      y: [412900, 412901],
      temporalId: { i: 3600, t: 5 },
    };
    expect(SpatialIdSchema.safeParse(id).success).toBe(true);
  });

  it("範囲外の値は client の検証で失敗する", () => {
    for (const id of [
      { z: 31, f: 0, x: 0, y: 0 },
      { z: 3, f: -9, x: 0, y: 0 },
      { z: 3, f: 0, x: 8, y: 0 },
      { z: 3, f: 0, x: 0, y: 0, temporalId: { i: 0, t: 0 } },
    ]) {
      expect(SpatialIdSchema.safeParse(id).success).toBe(false);
    }
  });

  it("x は逆順（経度 180 度をまたぐ範囲）を受け付ける", () => {
    expect(
      SpatialIdSchema.safeParse({ z: 3, f: 0, x: [6, 1], y: 0 }).success,
    ).toBe(true);
  });
});

describe("toRangeId / fromRangeId", () => {
  it("往復で元に戻り、両端が同じ範囲は 1 つの値になる", () => {
    const id = {
      z: 20,
      f: 0,
      x: [931389, 931390] as [number, number],
      y: 412900,
      temporalId: { i: 60, t: 5 },
    };
    expect(fromRangeId(toRangeId(id))).toEqual(id);
    expect(toRangeId({ z: 20, f: [0, 0], x: 1, y: 2 }).toString()).toBe(
      "20/0/1/2",
    );
  });
});
