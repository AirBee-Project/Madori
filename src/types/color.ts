import { z } from "zod";

export const ColorSchema = z.object({
  r: z
    .number()
    .int("redは整数で入力してください")
    .min(0, "redは0から255の間で入力してください")
    .max(255, "redは0から255の間で入力してください"),
  g: z
    .number()
    .int("greenは整数で入力してください")
    .min(0, "greenは0から255の間で入力してください")
    .max(255, "greenは0から255の間で入力してください"),
  b: z
    .number()
    .int("blueは整数で入力してください")
    .min(0, "blueは0から255の間で入力してください")
    .max(255, "blueは0から255の間で入力してください"),
  a: z
    .number()
    .int("透明度は整数で入力してください")
    .min(0, "透明度は0から255の間で入力してください")
    .max(255, "透明度は0から255の間で入力してください"),
});
/**
 * zodによる色の型定義
 */
export type Color = z.infer<typeof ColorSchema>;
