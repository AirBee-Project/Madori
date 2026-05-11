import { describe, expect, it } from "vitest";
import { SpatioTemporalIdSchema } from "./spatioTemporalId";

describe("SpatioTemporalIdSchema", () => {
  describe("正常系", () => {
    it("空間IDのみでパースできる", () => {
      const result = SpatioTemporalIdSchema.safeParse({
        spatialId: {
          z: 3,
          f: 0,
          x: 4,
          y: 7,
        },
      });

      expect(result.success).toBe(true);
    });

    it("空間IDと時間IDを両方パースできる", () => {
      const result = SpatioTemporalIdSchema.safeParse({
        spatialId: {
          z: 3,
          f: 0,
          x: 4,
          y: 7,
        },
        temporalId: {
          i: 1,
          t: [100, 200],
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe("異常系", () => {
    it("空間IDが不正なら失敗する", () => {
      const result = SpatioTemporalIdSchema.safeParse({
        spatialId: {
          z: 31,
          f: 0,
          x: 4,
          y: 7,
        },
      });

      expect(result.success).toBe(false);
    });

    it("時間IDが不正なら失敗する", () => {
      const result = SpatioTemporalIdSchema.safeParse({
        spatialId: {
          z: 3,
          f: 0,
          x: 4,
          y: 7,
        },
        temporalId: {
          i: 1,
          t: [200, 100],
        },
      });

      expect(result.success).toBe(false);
    });
  });
});
