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

/** 利用可能なデータベースの一覧を取得 */
export function listDatabases(signal?: AbortSignal): Promise<DatabaseInfo[]> {
  return kasaneFetch("/databases", { schema: DatabaseListSchema, signal });
}

/** 選択したデータベースの中にあるテーブル一覧を取得 */
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
 * 空間IDの範囲を指定してデータを検索
 * kasaneはテーブルに含まれている空間IDリストを返す（z=21固定)
 */
export async function searchData(
  dbName: string,
  tableName: string,
  spatialIds: SpatialIdRequest[],
  zoomLevelPolicy: ZoomLevelPolicy = "Ignore",
  signal?: AbortSignal,
): Promise<SpatialData[]> {
  const res = await kasaneFetch(
    `/databases/${encodeURIComponent(dbName)}/tables/${encodeURIComponent(
      tableName,
    )}/data/search`,
    {
      method: "POST",
      //spatial_idsは画面に含まれているタイルをIDに変換したもの
      //zoom_level_policyはignoreでz=21固定
      body: { spatial_ids: spatialIds, zoom_level_policy: zoomLevelPolicy },
      schema: GetDataResponseSchema,
      signal,
    },
  );
  return res.ids;
}
