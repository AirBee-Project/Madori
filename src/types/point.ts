import { z } from "zod";
import { RGBAColorSchema } from "./color";

export const PointSchema = z.object({
  id: z.string(),
  latitude: z
    .number()
    .min(-85.0511, "緯度は-85.0511から85.0511の間で入力してください")
    .max(85.0511, "緯度は-85.0511から85.0511の間で入力してください"),
  longitude: z
    .number()
    .min(-180, "経度は-180から180の間で入力してください")
    .max(180, "経度は-180から180の間で入力してください"),
  altitude: z.number().min(0, "高度は0以上で入力してください").default(0),
  color: RGBAColorSchema.optional().default({
    r: 0,
    g: 0,
    b: 0,
    a: 255,
  }),
});

/**
 * 点の型定義
 */
export type Point = z.infer<typeof PointSchema>;

/**
 * idを除いた点のスキーマ
 */
export const PointWithoutIdSchema = PointSchema.omit({ id: true });

/**
 * idを除いた点の型定義
 */
export type PointWithoutId = z.infer<typeof PointWithoutIdSchema>;

/**
 * 部分更新用のスキーマ
 */
export const PointPartialSchema = PointSchema.partial();

/**
 * 部分更新用の型定義
 */
export type PointPartial = z.infer<typeof PointPartialSchema>;
