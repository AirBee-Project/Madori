import { z } from "zod";

/**
 * 時間IDの各次元のインデックス値
 */
const TemporalIndexSchema = z
  .union([
    // 標準的なインデックス値
    z.number(),

    // 範囲表現
    z.tuple([z.number(), z.number()]),
  ])
  .superRefine((value, ctx) => {
    // 標準的なインデックス値
    if (typeof value === "number") {
      return;
    }

    //区間表現
    const [min, max] = value;
    if (min > max) {
      ctx.addIssue({
        code: "custom",
        message: "開始時刻と終了時刻の順序が逆です。",
      });
    }
  });

/**
 * 時間ID
 */
export const TemporalIdSchema = z.object({
  i: z
    .number()
    .int()
    .positive()
    .min(1, "インターバルは1以上で指定してください。"),
  t: TemporalIndexSchema,
});

/**
 * 時間IDの型定義
 */
export type TemporalId = z.infer<typeof TemporalIdSchema>;
