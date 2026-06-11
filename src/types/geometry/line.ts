import { z } from "zod";
import { RGBAColorSchema } from "./color";
import { PointSchema } from "./point";

export const LineSchema = z.object({
  id: z.string(),
  start: PointSchema.omit({ id: true }),
  end: PointSchema.omit({ id: true }),
  // 繋ぐ線
  color: RGBAColorSchema.optional(),
  width: z.number().min(0.1, "太さは0.1以上で指定してください").default(2),
});

/**
 * 線の型定義
 */
export type Line = z.infer<typeof LineSchema>;

/**
 * idを除いた線のスキーマ
 */
export const LineWithoutIdSchema = LineSchema.omit({ id: true });

/**
 * idを除いた線の型定義
 */
export type LineWithoutId = z.infer<typeof LineWithoutIdSchema>;

/**
 * 部分更新用のスキーマ
 */
export const LinePartialSchema = LineSchema.extend({
  width: z.number().min(0.1, "太さは0.1以上で指定してください").optional(),
}).partial();

/**
 * 部分更新用の型定義
 */
export type LinePartial = z.infer<typeof LinePartialSchema>;
