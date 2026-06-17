import type { MapViewState } from "@deck.gl/core";
import { WebMercatorViewport } from "@deck.gl/core";
import { useEffect, useRef } from "react";
import { searchData } from "../../api/kasane/api";
import { useKasaneStore } from "../../stores/kasaneStore";
import { useMapStore } from "../../stores/mapStore";
import { useSpatialIdGroupStore } from "../../stores/spatialIdGroupStores";
import {
  boundsToZfxyRange,
  clampRangeAroundCenter,
  pickZoomLevel,
  rangeCellCount,
  type ZfxyRange,
  zfxyRangeToRangeId,
} from "../../utils/kasaneTiles";

/** Kasaneデータの描画色（共通グループ単色） */
const KASANE_COLOR = { r: 220, g: 120, b: 20, a: 160 };
/** これを超える x*y セル範囲はロードせず案内を出す（全国ロード防止） */
const MAX_CELLS = 4096;
/**
 * 取得する近傍範囲の半径（タイル数）。画面中心からこの範囲だけ取得する。
 * ビューポートがこれより小さければ画面全体、広ければ中心近傍だけになる。
 */
const LOAD_RADIUS_TILES = 8;
/** 連続したカメラ移動を間引くデバウンス(ms) */
const DEBOUNCE_MS = 250;

const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

type Cell = { z: number; f: number; x: number; y: number };

/** 現在のビューポートから ZFXY タイル範囲を求める */
function computeViewportRange(
  viewState: MapViewState,
  maxZoomLevel: number,
): ZfxyRange {
  const z = pickZoomLevel(viewState.zoom ?? 0, maxZoomLevel);
  const vp = new WebMercatorViewport({
    longitude: viewState.longitude ?? 0,
    latitude: viewState.latitude ?? 0,
    zoom: viewState.zoom ?? 0,
    pitch: viewState.pitch ?? 0,
    bearing: viewState.bearing ?? 0,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // 画面4隅を逆投影してビューポートのAABB（緯度経度）を得る
  const corners = [
    [0, 0],
    [vp.width, 0],
    [0, vp.height],
    [vp.width, vp.height],
  ].map((p) => vp.unproject(p));
  const lngs = corners.map((c) => c[0]);
  const lats = corners.map((c) => c[1]);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);
  const south = clamp(Math.min(...lats), -85.05, 85.05);
  const north = clamp(Math.max(...lats), -85.05, 85.05);

  return boundsToZfxyRange(west, south, east, north, z);
}

/** 共通グループを削除する */
function clearGroup(): void {
  const k = useKasaneStore.getState();
  if (k.groupId) {
    useSpatialIdGroupStore.getState().removeSpatialIdGroup(k.groupId);
    k.setGroupId(null);
  }
}

/** 共通グループのセルを設定する（無ければ追加・あれば更新） */
function setGroupCells(spatialIds: Cell[]): void {
  const groups = useSpatialIdGroupStore.getState();
  const k = useKasaneStore.getState();
  const id = k.groupId;

  if (id && groups.spatialIdGroups.has(id)) {
    const res = groups.editSpatialIdGroup(id, { spatialIds });
    k.setError(res.success ? null : "取得データの検証に失敗しました。");
    return;
  }

  const before = new Set(groups.spatialIdGroups.keys());
  const res = groups.addSpatialIdGroup({ color: KASANE_COLOR, spatialIds });
  if (!res.success) {
    k.setError("取得データの検証に失敗しました。");
    return;
  }
  for (const key of useSpatialIdGroupStore.getState().spatialIdGroups.keys()) {
    if (!before.has(key)) {
      k.setGroupId(key);
      break;
    }
  }
  k.setError(null);
}

/**
 * 選択中のKasaneテーブルについて、現在のビューポート範囲のデータを動的にロードし、
 * 共通の空間IDグループストアへ描画する（キャッシュなし・常に現在の表示範囲を取得）。
 * UIを持たない（null を返す）。
 */
export default function KasaneViewportLoader() {
  const viewState = useMapStore((s) => s.viewState);
  const selectedDb = useKasaneStore((s) => s.selectedDb);
  const selectedTable = useKasaneStore((s) => s.selectedTable);

  const abortRef = useRef<AbortController | null>(null);
  const tableKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const tableKey =
      selectedDb && selectedTable
        ? `${selectedDb}/${selectedTable.name}`
        : null;

    // テーブル変更/解除: 進行中リクエストを中断し、既存グループを破棄
    if (tableKey !== tableKeyRef.current) {
      abortRef.current?.abort();
      clearGroup();
      tableKeyRef.current = tableKey;
      const k = useKasaneStore.getState();
      k.setNotice(null);
      k.setError(null);
    }

    if (!selectedDb || !selectedTable) return;
    const db = selectedDb;
    const table = selectedTable;
    const tableKeyForLoad = `${db}/${table.name}`;

    const loadViewport = async () => {
      const k = useKasaneStore.getState();
      // 画面中心の近傍だけに制限して負荷を抑える
      const range = clampRangeAroundCenter(
        computeViewportRange(viewState, table.max_zoom_level),
        LOAD_RADIUS_TILES,
      );
      if (rangeCellCount(range) > MAX_CELLS) {
        k.setNotice("範囲が広すぎます。ズームインしてください。");
        return;
      }
      k.setNotice(null);

      const controller = new AbortController();
      abortRef.current = controller;
      k.setLoading(true);
      try {
        const data = await searchData(
          db,
          table.name,
          [zfxyRangeToRangeId(range)],
          "Normalize",
          controller.signal,
        );
        // 取得中にテーブルが切り替わっていたら破棄
        if (tableKeyRef.current !== tableKeyForLoad) return;

        setGroupCells(
          data.map((d) => ({ z: d.id.z, f: d.id.f, x: d.id.x, y: d.id.y })),
        );
        k.setError(null);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          k.setError((e as Error).message);
        }
      } finally {
        k.setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      void loadViewport();
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [viewState, selectedDb, selectedTable]);

  return null;
}
