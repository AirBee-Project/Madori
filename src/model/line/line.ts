import { z } from "zod";
import { PointSchema } from "../point";
import { RGBAColorSchema } from "../rgba-color";

export const LineSchema = z.object({
  id: z
    .uuid({ message: "UUID形式のIDが必要です" })
    .describe("識別用のUUID（v4）"),

  start: PointSchema.omit({ id: true, rgbaColor: true }).describe("始点"),

  end: PointSchema.omit({ id: true, rgbaColor: true }).describe("終点"),

  rgbaColor: RGBAColorSchema,
});

export type Line = z.infer<typeof LineSchema>;
