import { executeQuery, searchData } from "../../api/kasane/api";
import {
  type CachedTilePayload,
  getCachedTile,
  saveTileToCache,
} from "../../api/kasane/cache";
import type {
  GetDataResponse,
  RangeId,
  TableDataType,
  TableInfo,
} from "../../api/kasane/types";
import { useKasaneStore } from "../../stores/kasaneStore";
import type { VoxelGeometry } from "../../types/geometry/spatioTemporalId/voxelGeometry";
import { createHeatmapColorScale } from "../../utils/color/heatmap";
import {
  type KasaneWorkerInput,
  type KasaneWorkerOutput,
  VOXEL_STRIDE,
} from "../../workers/kasaneWorkerProtocol";
import { KASANE_COLOR } from "./kasaneSublayers";

/**
 * Kasaneタイルのデータ取得層。
 * API通信・IndexedDBキャッシュ・Workerでのジオメトリ変換をまとめる。
 */

export const createWorker = () =>
  new Worker(new URL("../../workers/kasaneWorker.ts", import.meta.url), {
    type: "module",
  });

// Kasaneのheatmap用カラースケール (0〜100 の固定範囲)
const heatmapColorScale = createHeatmapColorScale([0, 100]);

/**
 * 1次元配列(Float64Array)から、VoxelGeometryの配列へ復元する。
 */
function unpackGeometries(payload: CachedTilePayload): VoxelGeometry[] {
  const { buffer, voxelIds, count, valueRefs, dictionary } = payload;
  const result: VoxelGeometry[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const o = i * VOXEL_STRIDE;
    const st = buffer[o + 21];
    const et = buffer[o + 22];
    const value = dictionary[valueRefs[i]];
    result[i] = {
      points: [
        [buffer[o], buffer[o + 1], buffer[o + 2]],
        [buffer[o + 3], buffer[o + 4], buffer[o + 5]],
        [buffer[o + 6], buffer[o + 7], buffer[o + 8]],
        [buffer[o + 9], buffer[o + 10], buffer[o + 11]],
        [buffer[o + 12], buffer[o + 13], buffer[o + 14]],
      ],
      altitude: buffer[o + 15],
      elevation: buffer[o + 16],
      color: {
        r: buffer[o + 17],
        g: buffer[o + 18],
        b: buffer[o + 19],
        a: buffer[o + 20],
      },
      voxelId: voxelIds[i],
      startTime: Number.isNaN(st) ? null : st,
      endTime: Number.isNaN(et) ? null : et,
      value:
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
          ? value
          : undefined,
    };
  }
  return result;
}

function mapDictionaryToColors(dictionary: unknown[], dataType: TableDataType) {
  // 数値系のテーブルはヒートマップ色、それ以外はデフォルト色で描画する
  const isHeatmap = dataType === "Int" || dataType === "Float";
  return dictionary.map((val) => {
    let cellColor: { r: number; g: number; b: number; a: number } | undefined;
    if (isHeatmap) {
      const numVal = typeof val === "number" ? val : Number(val);
      if (!Number.isNaN(numVal)) {
        cellColor = heatmapColorScale(numVal);
      }
    }
    return cellColor;
  });
}

async function processCellsWithWorker(
  response: GetDataResponse,
  dataType: TableDataType,
  maxZoom: number,
  workerPool: Worker[],
  signal?: AbortSignal,
): Promise<{ geometries: VoxelGeometry[]; payload: CachedTilePayload }> {
  return new Promise<{
    geometries: VoxelGeometry[];
    payload: CachedTilePayload;
  }>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const worker = workerPool[Math.floor(Math.random() * workerPool.length)];
    const jobId = crypto.randomUUID();

    const cleanup = () => {
      worker.removeEventListener("message", onMessage);
      if (signal) signal.removeEventListener("abort", onAbort);
    };

    const onMessage = (e: MessageEvent<KasaneWorkerOutput>) => {
      if (e.data.jobId !== jobId) return;
      cleanup();
      const payload = e.data.payload;
      resolve({
        geometries: unpackGeometries(payload),
        payload,
      });
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };

    worker.addEventListener("message", onMessage);
    if (signal) {
      signal.addEventListener("abort", onAbort);
    }

    const msg: KasaneWorkerInput = {
      type: "PARSE_VOXELS",
      jobId,
      payload: {
        data: response.data,
        colors: mapDictionaryToColors(response.dictionary, dataType),
        dictionary: response.dictionary,
        defaultColor: KASANE_COLOR,
        maxZoom,
      },
    };
    worker.postMessage(msg);
  });
}

function calculateRangeId(x: number, y: number, z: number): RangeId | null {
  const maxIdx = 2 ** z - 1;
  if (x < 0 || x > maxIdx || y < 0 || y > maxIdx) {
    return null;
  }

  const resolution = 33554432 / 2 ** z;
  const fMinPractical = Math.max(-(2 ** z), Math.floor(-2000 / resolution));
  const fMaxPractical = Math.min(maxIdx, Math.ceil(10000 / resolution));

  return {
    z,
    f: [fMinPractical, fMaxPractical],
    x: [x, x],
    y: [y, y],
    type: "rangeId",
  };
}

/**
 * タイルデータの取得から加工・キャッシュまでを一元管理する関数。
 * IndexedDBにArrayBufferのキャッシュがあれば、API通信とWorker計算をスキップして高速化する。
 */
async function fetchAndProcessTileData(
  cacheKey: string,
  selectedDb: string,
  table: TableInfo,
  rangeId: RangeId,
  queryConfig:
    | { radiusX: number; radiusY: number; zoomOutLevel: number }
    | undefined,
  workerPool: Worker[],
  signal?: AbortSignal,
): Promise<VoxelGeometry[]> {
  const cachedPayload = await getCachedTile(cacheKey);

  let geometries: VoxelGeometry[];
  let dictionary: unknown[];

  // valueRefs を持たない旧形式のキャッシュは値を復元できないため、ミス扱いで再取得する
  if (cachedPayload?.valueRefs) {
    // キャッシュヒット: API通信・Worker計算をスキップし、バイナリデータから即座に復元する
    geometries = unpackGeometries(cachedPayload);
    dictionary = cachedPayload.dictionary;
  } else {
    let response: GetDataResponse;
    if (queryConfig) {
      const query = {
        input: {
          input: {
            input: {
              database: selectedDb,
              table: table.name,
              type: "source",
            },
            policy: "average",
            type: "zoomOut",
            z: queryConfig.zoomOutLevel,
          },
          policy: "max",
          radius: queryConfig.radiusX,
          type: "falloffLinearX",
          z: queryConfig.zoomOutLevel,
        },
        policy: "max",
        radius: queryConfig.radiusY,
        type: "falloffLinearY",
        z: queryConfig.zoomOutLevel,
      };
      response = await executeQuery(query, [rangeId], table.data_type, signal);
    } else {
      response = await searchData(
        selectedDb,
        table.name,
        [rangeId],
        "Normalize",
        signal,
      );
    }

    if (response.data.length === 0) {
      return [];
    }

    const result = await processCellsWithWorker(
      response,
      table.data_type,
      table.max_zoom_level,
      workerPool,
      signal,
    );
    geometries = result.geometries;
    dictionary = result.payload.dictionary;

    void saveTileToCache(cacheKey, result.payload);
  }

  // 値ごとの色設定UIで使うため、このテーブルで観測した値を記録する
  if (dictionary.length > 0) {
    useKasaneStore.getState().registerObservedValues(table.name, dictionary);
  }

  return geometries;
}

export async function fetchTileDataForLayer(
  tile: { index: { x: number; y: number; z: number }; signal?: AbortSignal },
  selectedDb: string,
  table: TableInfo,
  queryConfig:
    | { radiusX: number; radiusY: number; zoomOutLevel: number }
    | undefined,
  workerPool: Worker[],
  incrementLoading: () => void,
  decrementLoading: () => void,
): Promise<VoxelGeometry[]> {
  const { x, y, z } = tile.index;
  const { signal } = tile;

  const rangeId = calculateRangeId(x, y, z);
  if (!rangeId) {
    return [];
  }

  const queryKey = queryConfig
    ? `-${queryConfig.radiusX}-${queryConfig.radiusY}-${queryConfig.zoomOutLevel}`
    : "";
  const cacheKey = `${selectedDb}-${table.name}${queryKey}-${z}-${x}-${y}`;

  incrementLoading();
  try {
    const geometries = await fetchAndProcessTileData(
      cacheKey,
      selectedDb,
      table,
      rangeId,
      queryConfig,
      workerPool,
      signal,
    );

    if (geometries.length === 0) {
      return [];
    }

    return geometries;
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      throw e;
    }
    console.error("Kasane tile load error:", e);
    return [];
  } finally {
    decrementLoading();
  }
}
