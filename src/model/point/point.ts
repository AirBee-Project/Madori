import { z } from "zod";
import { RGBAColorSchema } from "../rgba-color";

export const PointSchema = z.object({
  id: z
    .uuid({ message: "UUID形式のIDが必要です" })
    .describe("識別用のUUID（v4）"),

  /**
   * 緯度（-85.0511〜85.0511）
   */
  lat: z
    .number({ error: "緯度は数値である必要があります" })
    .min(-85.0511, { message: "緯度は-85.0511度以上です" })
    .max(85.0511, { message: "緯度は85.0511度以下です" })
    .describe("緯度（Web Mercatorの有効範囲: -85.0511〜85.0511）"),

  /**
   * 経度（-180〜180）
   */
  lon: z
    .number({ error: "経度は数値である必要があります" })
    .min(-180, { message: "経度は-180度以上です" })
    .max(180, { message: "経度は180度以下です" })
    .describe("経度（-180〜180）"),

  altitude: z
    .number({ error: "高度は数値である必要があります" })
    .min(-33554432, { message: "高度は-33554432m以上です" })
    .max(33554432, { message: "高度は33554432m以下です" })
    .optional()
    .default(0)
    .describe("高度（メートル）。未指定の場合は0"),

  rgbaColor: RGBAColorSchema,
});

export type Point = z.infer<typeof PointSchema>;
