import { describe, expect, it } from "vitest";
import { SpatialIdSchema } from "./spatialId";

describe("SpatialIdSchema", () => {
  describe("正常系", () => {
    it("単一インデックスをパースできる", () => {
      const result = SpatialIdSchema.safeParse({
        z: 3,
        f: 0,
        x: 4,
        y: 7,
      });

      expect(result.success).toBe(true);
    });

    it("範囲表現をパースできる", () => {
      const result = SpatialIdSchema.safeParse({
        z: 3,
        f: [-1, 1],
        x: [7, 0], // x は逆転OK
        y: [0, 7],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("ズームレベル以上系", () => {
    it("ズームレベルが負の値", () => {
      const result = SpatialIdSchema.safeParse({
        z: -1,
        f: 0,
        x: 4,
        y: 7,
      });

      expect(result.success).toBe(false);
    });

    it("ズームレベルが31以上", () => {
      const result = SpatialIdSchema.safeParse({
        z: 31,
        f: [-1, 1],
        x: [7, 0],
        y: [0, 7],
      });

      expect(result.success).toBe(false);
    });
  });

  describe("範囲外", () => {
    it("x が最大値を超える場合は失敗する", () => {
      const result = SpatialIdSchema.safeParse({
        z: 3,
        f: 0,
        x: 8,
        y: 0,
      });

      expect(result.success).toBe(false);
    });

    it("y が負数の場合は失敗する", () => {
      const result = SpatialIdSchema.safeParse({
        z: 3,
        f: 0,
        x: 0,
        y: -1,
      });

      expect(result.success).toBe(false);
    });

    it("f が最小値未満の場合は失敗する", () => {
      const result = SpatialIdSchema.safeParse({
        z: 3,
        f: -9,
        x: 0,
        y: 0,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("範囲表現", () => {
    it("f は逆転不可", () => {
      const result = SpatialIdSchema.safeParse({
        z: 3,
        f: [1, -1],
        x: 0,
        y: 0,
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("f の範囲指定が不正");
      }
    });

    it("y は逆転不可", () => {
      const result = SpatialIdSchema.safeParse({
        z: 3,
        f: 0,
        x: 0,
        y: [7, 0],
      });

      expect(result.success).toBe(false);
    });

    it("x は逆転可能", () => {
      const result = SpatialIdSchema.safeParse({
        z: 3,
        f: 0,
        x: [7, 0],
        y: 0,
      });

      expect(result.success).toBe(true);
    });
  });
});
