import { create } from "zustand";
import type { DatabaseInfo, TableInfo } from "../api/kasane/types";

/**
 * Kasane の選択状態と読み込み状態を管理するストア。
 * 接続先の情報を管理
 */
interface KasaneState {
  databases: DatabaseInfo[];
  tables: TableInfo[];
  selectedDb: string | null;
  selectedTable: TableInfo | null;
  /** 共通ストアに描画中の空間IDグループのID */
  groupId: string | null;
  loading: boolean;
  error: string | null;
  /** ズームアウトしすぎ等の案内メッセージ */
  notice: string | null;

  setDatabases: (databases: DatabaseInfo[]) => void;
  setTables: (tables: TableInfo[]) => void;
  selectDb: (db: string | null) => void;
  selectTable: (table: TableInfo | null) => void;
  setGroupId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNotice: (notice: string | null) => void;
}

export const useKasaneStore = create<KasaneState>((set) => ({
  databases: [],
  tables: [],
  selectedDb: null,
  selectedTable: null,
  groupId: null,
  loading: false,
  error: null,
  notice: null,

  setDatabases: (databases) => set({ databases }),
  setTables: (tables) => set({ tables }),
  selectDb: (selectedDb) =>
    set({ selectedDb, tables: [], selectedTable: null }),
  selectTable: (selectedTable) => set({ selectedTable }),
  setGroupId: (groupId) => set({ groupId }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setNotice: (notice) => set({ notice }),
}));
