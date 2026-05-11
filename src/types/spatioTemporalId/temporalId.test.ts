import { describe, expect, it } from "vitest";
import { TemporalIdSchema } from "./temporalId";

describe("TemporalIdSchema", () => {
  describe("正常系", () => {
    it("単一時刻をパースできる", () => {
      const result = TemporalIdSchema.safeParse({
        i: 1,
        t: 100,
      });

      expect(result.success).toBe(true);
    });

    it("時間範囲をパースできる", () => {
      const result = TemporalIdSchema.safeParse({
        i: 1,
        t: [100, 200],
      });

      expect(result.success).toBe(true);
    });

    it("開始時刻と終了時刻が同じでも許可される", () => {
      const result = TemporalIdSchema.safeParse({
        i: 1,
        t: [100, 100],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("異常系", () => {
    it("開始時刻 > 終了時刻 の場合は失敗する", () => {
      const result = TemporalIdSchema.safeParse({
        i: 1,
        t: [200, 100],
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "開始時刻と終了時刻の順序が逆です。",
        );
      }
    });

    it("i が負数の場合は失敗する", () => {
      const result = TemporalIdSchema.safeParse({
        i: -1,
        t: 100,
      });

      expect(result.success).toBe(false);
    });

    it("i が整数でない場合は失敗する", () => {
      const result = TemporalIdSchema.safeParse({
        i: 1.5,
        t: 100,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("境界値", () => {
    it("i=0 を許可する", () => {
      const result = TemporalIdSchema.safeParse({
        i: 0,
        t: 100,
      });

      expect(result.success).toBe(false);
    });
  });
});
