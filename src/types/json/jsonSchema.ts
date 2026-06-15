import { z } from "zod";

/**
 * JSON用のIDスキーマ
 */
export const JsonIdSchema = z.object({
  z: z.number().int(),
  f: z.union([z.number(), z.tuple([z.number(), z.number()])]).optional(),
  x: z.union([z.number(), z.tuple([z.number(), z.number()])]).optional(),
  y: z.union([z.number(), z.tuple([z.number(), z.number()])]).optional(),
  i: z.number().optional(),
  t: z.union([z.number(), z.tuple([z.number(), z.number()])]).optional(),
  ref: z.number().int(),
});

/**
 * JSONファイルのスキーマ
 */
export const JsonFileSchema = z.object({
  meta: z
    .object({
      kasaneSchemaVersion: z.string(),
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
