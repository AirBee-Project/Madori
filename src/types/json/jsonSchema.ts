import { z } from "zod";

/**
 * 各次元（f/x/y/t）のインデックス値スキーマ
 * 単一値は [n]、範囲は [start, end] のように 1〜2 要素の配列で表現する
 */
const JsonIndexSchema = z.array(z.number()).min(1).max(2);

/**
 * JSON用のIDスキーマ
 */
export const JsonIdSchema = z.object({
  z: z.number().int(),
  f: JsonIndexSchema.optional(),
  x: JsonIndexSchema.optional(),
  y: JsonIndexSchema.optional(),
  i: z.number().optional(),
  t: JsonIndexSchema.optional(),
  ref: z.number().int(),
});

/**
 * JSONファイルのスキーマ
 */
export const JsonFileSchema = z.object({
  meta: z
    .object({
      version: z.string(),
      description: z.string().optional(),
    })
    .optional(),
  option: z.any().optional(),
  data: z.array(
    z.object({
      name: z.string(),
      value: z.array(z.number()),
      ids: z.array(JsonIdSchema),
    }),
  ),
});

export type JsonIdType = z.infer<typeof JsonIdSchema>;
export type JsonFileType = z.infer<typeof JsonFileSchema>;
