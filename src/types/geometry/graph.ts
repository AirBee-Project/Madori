import { z } from "zod";
import { RGBAColorSchema } from "./color";

/**
 * グラフの頂点が持つ空間位置情報
 */
export const GraphNodeSchema = z.object({
  latitude: z
    .number()
    .min(-85.0511, "緯度は-85.0511から85.0511の間で入力してください")
    .max(85.0511, "緯度は-85.0511から85.0511の間で入力してください"),
  longitude: z
    .number()
    .min(-180, "経度は-180から180の間で入力してください")
    .max(180, "経度は-180から180の間で入力してください"),
  altitude: z.number(),
});

export type GraphNode = z.infer<typeof GraphNodeSchema>;

/**
 * 隣接する頂点とのエッジ属性
 */
export const GraphEdgeSchema = z.object({
  node: z.string(),
  cost: z.number(),
  risk: z.number(),
});

export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

/**
 * schema.json (UndirectedSpatialGraph) に対応するJSONファイルのスキーマ
 */
export const GraphFileSchema = z.object({
  nodes: z.record(z.string(), GraphNodeSchema),
  adjacency: z.record(z.string(), z.array(GraphEdgeSchema)),
});

export type GraphFile = z.infer<typeof GraphFileSchema>;

/**
 * アプリ内で1つのグラフ描画単位として扱うグループ
 * （ノード色・エッジ色・不透明度・元データを保持する）
 */
export const GraphGroupSchema = GraphFileSchema.extend({
  id: z.string(),
  name: z.string(),
  nodeColor: RGBAColorSchema,
  edgeColor: RGBAColorSchema,
});

/**
 * グラフグループの型定義
 */
export type GraphGroup = z.infer<typeof GraphGroupSchema>;

/**
 * idを除いたグラフグループのスキーマ
 */
export const GraphGroupWithoutIdSchema = GraphGroupSchema.omit({ id: true });

/**
 * idを除いたグラフグループの型定義
 */
export type GraphGroupWithoutId = z.infer<typeof GraphGroupWithoutIdSchema>;

/**
 * 部分更新用のスキーマ
 */
export const GraphGroupPartialSchema = GraphGroupSchema.partial();

/**
 * 部分更新用の型定義
 */
export type GraphGroupPartial = z.infer<typeof GraphGroupPartialSchema>;
