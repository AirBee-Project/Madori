import { z } from "zod";

/**
 * 空間IDの各次元のインデックス値
 */
const SpatialIndexSchema = z.union([
  // 標準的なインデックス値
  z.number(),
  // 範囲表現
  z.tuple([z.number(), z.number()]),
]);

type IndexValue = z.infer<typeof SpatialIndexSchema>;

/**
 * 空間ID
 */
export const SpatialIdSchema = z
  .object({
    z: z
      .number()
      .int()
      .min(0, "ズームレベルは0以上で指定してください。")
      .max(30, "ズームレベルは30以下で指定してください。"),
    f: SpatialIndexSchema,
    x: SpatialIndexSchema,
    y: SpatialIndexSchema,
  })
  .superRefine((data, ctx) => {
    validateIndexRange(
      data.f,
      f_min[data.z],
      fxy_max[data.z],
      "f",
      data.z,
      ctx,
    );
    validateIndexRange(data.x, 0, fxy_max[data.z], "x", data.z, ctx);
    validateIndexRange(data.y, 0, fxy_max[data.z], "y", data.z, ctx);
  });

/**
 * 空間IDの型定義
 */
export type SpatialId = z.infer<typeof SpatialIdSchema>;

/**
 * 空間IDの各次元のインデックス値を検証する関数
 */
function validateIndexRange(
  value: IndexValue,
  min: number,
  max: number,
  dimension: "f" | "x" | "y",
  z: number,
  ctx: z.RefinementCtx,
) {
  /**
   * 値がズームレベルに応じた範囲になっているか確認する関数
   * 範囲外の場合はエラーを返す
   */
  function validate(v: number) {
    if (v < min || v > max) {
      ctx.addIssue({
        code: "custom",
        message:
          `${dimension}インデックスは ` +
          `Z=${z} において ${min} から ${max} の間で指定してください。`,
      });
    }
  }

  // 標準的なインデックス値の場合
  if (typeof value === "number") {
    validate(value);
    return;
  }

  // 区間表現の場合
  const [rangeMin, rangeMax] = value;

  validate(rangeMin);
  validate(rangeMax);

  // FとYの場合は常に rangeMin <= rangeMax が成立する
  // Xは地球が球体であることから、逆転の可能性があるためチェックしない
  if ((dimension === "f" || dimension === "y") && rangeMin > rangeMax) {
    ctx.addIssue({
      code: "custom",
      message: `${dimension} の範囲指定が不正です。`,
    });
  }
}

/// 各ズームレベルにおける最大のインデックス値
const fxy_max = [
  0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767,
  65535, 131071, 262143, 524287, 1048575, 2097151, 4194303, 8388607, 16777215,
  33554431, 67108863, 134217727, 268435455, 536870911, 1073741823,
] as const;

/// 高度方向における、各ズームレベルの最小インデックス値
const f_min = [
  -1, -2, -4, -8, -16, -32, -64, -128, -256, -512, -1024, -2048, -4096, -8192,
  -16384, -32768, -65536, -131072, -262144, -524288, -1048576, -2097152,
  -4194304, -8388608, -16777216, -33554432, -67108864, -134217728, -268435456,
  -536870912, -1073741824,
] as const;
