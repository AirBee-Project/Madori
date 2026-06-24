import { z } from "zod";

/**
 * Kasane OpenAPI (openapi.yaml) の components を写した zod スキーマ・型。
 */

export const TableDataTypeSchema = z.enum(["Text", "Int", "Float", "Boolean"]);
export type TableDataType = z.infer<typeof TableDataTypeSchema>;

export const ZoomLevelPolicySchema = z.enum(["Error", "Ignore"]);
export type ZoomLevelPolicy = z.infer<typeof ZoomLevelPolicySchema>;

/** 単一セルの時空間ID */
export const SingleIdSchema = z.object({
  z: z.number().int(),
  f: z.number().int(),
  x: z.number().int(),
  y: z.number().int(),
});
export type SingleId = z.infer<typeof SingleIdSchema>;

/** 範囲指定の時空間ID（リクエストで使用） */
export type RangeId = {
  z: number;
  f: [number, number];
  x: [number, number];
  y: [number, number];
  type: "rangeId";
};

/** /data/search に渡す空間ID（今回は範囲指定のみ使用） */
export type SpatialIdRequest = RangeId;

export const SpatialDataSchema = z.object({
  id: SingleIdSchema,
  data: z.unknown(),
});
export type SpatialData = z.infer<typeof SpatialDataSchema>;

export const GetDataResponseSchema = z.object({
  ids: z.array(SpatialDataSchema),
});
export type GetDataResponse = z.infer<typeof GetDataResponseSchema>;

export const LoginResponseSchema = z.object({
  token: z.string(),
});

export const DatabaseInfoResponseSchema = z.object({
  name: z.string(),
});
export type DatabaseInfo = z.infer<typeof DatabaseInfoResponseSchema>;
export const DatabaseListSchema = z.array(DatabaseInfoResponseSchema);

export const TableInfoResponseSchema = z.object({
  name: z.string(),
  data_type: TableDataTypeSchema,
  max_zoom_level: z.number().int(),
});
export type TableInfo = z.infer<typeof TableInfoResponseSchema>;
export const TableListSchema = z.array(TableInfoResponseSchema);
