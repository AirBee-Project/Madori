import { kasaneFetch } from "./client";
import {
  type DatabaseInfo,
  DatabaseListSchema,
  GetDataResponseSchema,
  type SpatialData,
  type SpatialIdRequest,
  type TableInfo,
  TableListSchema,
  type ZoomLevelPolicy,
} from "./types";

/** データベース一覧を取得 */
export function listDatabases(signal?: AbortSignal): Promise<DatabaseInfo[]> {
  return kasaneFetch("/databases", { schema: DatabaseListSchema, signal });
}

/** 指定DBのテーブル一覧を取得 */
export function listTables(
  dbName: string,
  signal?: AbortSignal,
): Promise<TableInfo[]> {
  return kasaneFetch(`/databases/${encodeURIComponent(dbName)}/tables`, {
    schema: TableListSchema,
    signal,
  });
}

/**
 * 空間IDの範囲を指定してデータを検索する。
 * 返るのは「値が存在するセル」のみ（範囲全体ではない）。
 */
export async function searchData(
  dbName: string,
  tableName: string,
  spatialIds: SpatialIdRequest[],
  zoomLevelPolicy: ZoomLevelPolicy = "Normalize",
  signal?: AbortSignal,
): Promise<SpatialData[]> {
  const res = await kasaneFetch(
    `/databases/${encodeURIComponent(dbName)}/tables/${encodeURIComponent(
      tableName,
    )}/data/search`,
    {
      method: "POST",
      body: { spatial_ids: spatialIds, zoom_level_policy: zoomLevelPolicy },
      schema: GetDataResponseSchema,
      signal,
    },
  );
  return res.ids;
}
