import { RangeId } from "@airbee-project/kasane-client";
import { describe, expect, it } from "vitest";
import type { RGBAColor } from "../../types/geometry/color";
import {
  spatialIdGroupToGeometries,
  spatialIdToRangeIds,
  voxelToGeometry,
} from "./voxelToGeometry";

const color: RGBAColor = { r: 0, g: 128, b: 255, a: 255 };

describe("spatialIdToRangeIds", () => {
  it("範囲のまま 1 つにする", () => {
    const ids = spatialIdToRangeIds({
      z: 10,
      f: [1, 2],
      x: [100, 101],
      y: 200,
    });
    expect(ids.map(String)).toEqual(["10/1:2/100:101/200"]);
  });

  it("経度 180 度をまたぐ x は 2 つに分ける", () => {
    const ids = spatialIdToRangeIds({ z: 3, f: 0, x: [6, 1], y: 2 });
    expect(ids.map(String)).toEqual(["3/0/6:7/2", "3/0/0:1/2"]);
  });

  it("rangeMode でなければ 1 ボクセルずつにする", () => {
    const ids = spatialIdToRangeIds(
      { z: 3, f: 0, x: [7, 0], y: [1, 2], temporalId: { i: 60, t: [5, 6] } },
      false,
    );
    expect(ids).toHaveLength(8);
    expect(ids[0]?.toString()).toBe("3/0/7/1_60/5");
  });
});

describe("voxelToGeometry", () => {
  it("1 ボクセルの座標と時間", () => {
    const geom = voxelToGeometry(
      RangeId.create(10, 5, 100, 200).withTime(60, 100),
      color,
    );
    expect(geom.points[1][0]).toBeCloseTo(-144.84375, 5);
    expect(geom.points[0][0]).toBeCloseTo(-144.4921875, 5);
    expect(geom.altitude).toBe(163840);
    expect(geom.elevation).toBe(32768);
    expect([geom.startTime, geom.endTime]).toEqual([6000, 6060]);
    expect(geom.voxelId).toBe("10/5/100/200_60/100");
  });

  it("範囲は全体の外側を囲む", () => {
    const geom = voxelToGeometry(
      RangeId.create(10, [1, 2], [100, 101], [200, 201]),
      color,
    );
    expect(geom.points[1][0]).toBeCloseTo(-144.84375, 5);
    expect(geom.points[0][0]).toBeCloseTo(-144.140625, 5);
    expect(geom.altitude).toBe(32768);
    expect(geom.elevation).toBe(65536);
    expect([geom.startTime, geom.endTime]).toEqual([null, null]);
  });
});

describe("spatialIdGroupToGeometries", () => {
  it("キャッシュを使っても色はグループの色になる", () => {
    const spatialIds = [{ z: 10, f: 5, x: 100, y: 200 }];
    const first = spatialIdGroupToGeometries({ id: "a", color, spatialIds });
    const red = { r: 255, g: 0, b: 0, a: 128 };
    const second = spatialIdGroupToGeometries({
      id: "b",
      color: red,
      spatialIds,
    });
    expect(first[0]?.voxelId).toBe("10/5/100/200");
    expect(second[0]?.color).toEqual(red);
    expect(second[0]?.points).toEqual(first[0]?.points);
  });
});
