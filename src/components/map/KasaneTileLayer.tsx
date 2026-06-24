import { TileLayer } from "@deck.gl/geo-layers";
import { ScatterplotLayer, SolidPolygonLayer } from "@deck.gl/layers";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { searchData } from "../../api/kasane/api";
import type { RangeId } from "../../api/kasane/types";
import { useKasaneStore } from "../../stores/kasaneStore";
import {
  f_min,
  fxy_max,
} from "../../types/geometry/spatioTemporalId/spatialId";
import type { VoxelGeometry } from "../../types/geometry/spatioTemporalId/voxelGeometry";
import {
  type KasaneWorkerInput,
  type KasaneWorkerOutput,
  VOXEL_STRIDE,
} from "../../workers/kasaneWorkerProtocol";

const createWorker = () =>
  new Worker(new URL("../../workers/kasaneWorker.ts", import.meta.url), {
    type: "module",
  });

const KASANE_COLOR = { r: 220, g: 120, b: 20, a: 160 };

/**
 * 1次元配列(Float64Array)から、VoxelGeometryの配列へ復元する。
 */
function unpackGeometries(
  buffer: Float64Array,
  voxelIds: string[],
  count: number,
): VoxelGeometry[] {
  const result: VoxelGeometry[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const o = i * VOXEL_STRIDE;
    const st = buffer[o + 21];
    const et = buffer[o + 22];
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
    };
  }
  return result;
}

/**
 * 間引いたデータセット
 */
interface KasaneTileData {
  full: VoxelGeometry[];
  /** 1/2 間引き */
  half: VoxelGeometry[];
  /** 1/4 間引き */
  quarter: VoxelGeometry[];
  /** 1/8 間引き */
  eighth: VoxelGeometry[];
}

/**
 * データ取得直後に、1/1, 1/2, 1/4, 1/8 の解像度のデータを1回だけ作ってキャッシュ
 */
function buildLodData(geometries: VoxelGeometry[]): KasaneTileData {
  const half: VoxelGeometry[] = [];
  const quarter: VoxelGeometry[] = [];
  const eighth: VoxelGeometry[] = [];
  for (let i = 0; i < geometries.length; i++) {
    if (i % 2 === 0) half.push(geometries[i]);
    if (i % 4 === 0) quarter.push(geometries[i]);
    if (i % 8 === 0) eighth.push(geometries[i]);
  }
  return { full: geometries, half, quarter, eighth };
}

/**
 * キャッシュの中から、現在のカメラ距離適した解像度を選ぶ。
 */
function selectLodData(
  tileData: KasaneTileData,
  tileZ: number,
): { renderData: VoxelGeometry[]; isScatter: boolean } {
  if (tileZ < 14) {
    return {
      renderData: tileZ < 12 ? tileData.eighth : tileData.quarter,
      isScatter: true,
    };
  }
  if (tileZ < 15) {
    return { renderData: tileData.half, isScatter: false };
  }
  return { renderData: tileData.full, isScatter: false };
}

function createScatterLayer(id: string, data: VoxelGeometry[]) {
  return new ScatterplotLayer({
    id: `${id}-scatter`,
    data,
    getPosition: (d: VoxelGeometry) => [
      d.points[0][0],
      d.points[0][1],
      d.altitude,
    ],
    getFillColor: (d: VoxelGeometry) => [
      d.color.r,
      d.color.g,
      d.color.b,
      d.color.a,
    ],
    radiusMinPixels: 2,
    radiusMaxPixels: 8,
    pickable: true,
  });
}

function createPolygonLayer(id: string, data: VoxelGeometry[]) {
  return new SolidPolygonLayer({
    id: `${id}-polygon`,
    data,
    getPolygon: (d: VoxelGeometry) => d.points,
    getElevation: (d: VoxelGeometry) => d.elevation,
    getFillColor: (d: VoxelGeometry) => [
      d.color.r,
      d.color.g,
      d.color.b,
      d.color.a,
    ],
    extruded: true,
    wireframe: false,
    elevationScale: 1,
    pickable: true,
  });
}

export function useKasaneTileLayer() {
  const selectedDb = useKasaneStore((s) => s.selectedDb);
  const selectedTable = useKasaneStore((s) => s.selectedTable);
  const setLoading = useKasaneStore((s) => s.setLoading);

  // 0 ⇔ 1 の境界でのみ Zustand に通知する。
  const loadingCount = useRef(0);

  const incrementLoading = useCallback(() => {
    loadingCount.current++;
    if (loadingCount.current === 1) setLoading(true);
  }, [setLoading]);
  const decrementLoading = useCallback(() => {
    loadingCount.current = Math.max(0, loadingCount.current - 1);
    if (loadingCount.current === 0) setLoading(false);
  }, [setLoading]);

  const workerPool = useRef<Worker[]>([]);

  useEffect(() => {
    workerPool.current = Array.from({ length: 4 }, createWorker);
    return () => {
      for (const w of workerPool.current) {
        w.terminate();
      }
      workerPool.current = [];
    };
  }, []);

  const layer = useMemo(() => {
    if (!selectedDb || !selectedTable) return null;

    return new TileLayer<KasaneTileData>({
      id: `kasane-tile-layer-${selectedDb}-${selectedTable.name}`,
      data: null,
      minZoom: 0,
      maxZoom: selectedTable.max_zoom_level,
      tileSize: 256,

      refinementStrategy: "best-available",

      // 新しいタイルが画面に入るたびに呼ばれ、Kasaneからデータを取得する。
      getTileData: async (tile) => {
        const { x, y, z } = tile.index;
        const { signal } = tile;

        const maxIdx = fxy_max[z];
        if (x < 0 || x > maxIdx || y < 0 || y > maxIdx) {
          return { full: [], half: [], quarter: [], eighth: [] };
        }

        // F軸（高さ）の検索範囲を絞る
        const resolution = 33554432 / 2 ** z;
        const fMinPractical = Math.max(
          f_min[z],
          Math.floor(-2000 / resolution),
        );
        const fMaxPractical = Math.min(
          fxy_max[z],
          Math.ceil(10000 / resolution),
        );

        const rangeId: RangeId = {
          z,
          f: [fMinPractical, fMaxPractical],
          x: [x, x],
          y: [y, y],
          type: "rangeId",
        };

        incrementLoading();
        try {
          const cells = await searchData(
            selectedDb,
            selectedTable.name,
            [rangeId],
            "Ignore",
            signal,
          );

          if (cells.length === 0) {
            return { full: [], half: [], quarter: [], eighth: [] };
          }

          // 重い3D座標計算をworkersに任せ、メイン画面のフリーズを防ぐ。
          const geometries = await new Promise<VoxelGeometry[]>(
            (resolve, reject) => {
              // キャンセル済みなら AbortError を投げて Deck.gl に再取得させる
              if (signal?.aborted) {
                reject(new DOMException("Aborted", "AbortError"));
                return;
              }

              const worker =
                workerPool.current[
                  Math.floor(Math.random() * workerPool.current.length)
                ];

              const jobId = crypto.randomUUID();

              const cleanup = () => {
                worker.removeEventListener("message", onMessage);
                if (signal) signal.removeEventListener("abort", onAbort);
              };

              const onMessage = (e: MessageEvent<KasaneWorkerOutput>) => {
                if (e.data.jobId !== jobId) return;
                cleanup();
                const { buffer, voxelIds, count } = e.data.payload;
                resolve(unpackGeometries(buffer, voxelIds, count));
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
                  cells: cells.map((c) => ({
                    z: c.id.z,
                    f: c.id.f,
                    x: c.id.x,
                    y: c.id.y,
                  })),
                  color: KASANE_COLOR,
                },
              };
              worker.postMessage(msg);
            },
          );

          return buildLodData(geometries);
        } catch (e) {
          if ((e as Error).name === "AbortError") {
            throw e;
          }
          console.error("Kasane tile load error:", e);
          return { full: [], half: [], quarter: [], eighth: [] };
        } finally {
          decrementLoading();
        }
      },

      // データの揃ったタイルを地図に描画する。遠い時は点(Scatter)、近い時は面(Polygon)を使い分ける。
      renderSubLayers: (props) => {
        const tileData = props.data as KasaneTileData | null;
        if (!tileData) return null;

        const { renderData, isScatter } = selectLodData(
          tileData,
          props.tile.index.z,
        );
        if (renderData.length === 0) return null;

        return isScatter
          ? createScatterLayer(props.id, renderData)
          : createPolygonLayer(props.id, renderData);
      },

      updateTriggers: {
        getTileData: [selectedDb, selectedTable.name],
      },
    });
  }, [selectedDb, selectedTable, incrementLoading, decrementLoading]);

  return layer;
}
