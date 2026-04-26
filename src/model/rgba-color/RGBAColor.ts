import { z } from "zod";

export const RGBAColorSchema = z.object({
  r: z.number().int().min(0).max(255).describe("赤成分の0〜255の整数"),

  g: z.number().int().min(0).max(255).describe("緑成分の0〜255の整数"),

  b: z.number().int().min(0).max(255).describe("青成分の0〜255の整数"),

  a: z.number().min(0).max(1).optional().default(1).describe("不透明度"),
});

export type RGBAColor = z.infer<typeof RGBAColorSchema>;
