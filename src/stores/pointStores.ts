import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Point } from "../types/point";

interface PointState {
  points: Point[];
}

interface PointAction {
  addPoint: (point: Omit<Point, "id">) => void;
  removePoint: (id: string) => void;
  editPoint: (id: string, updates: Partial<Point>) => void;
}

/**
 * 点の状態管理フック
 */
export const usePointStore = create<PointState & PointAction>()(
  devtools(
    immer((set) => ({
      //初期状態
      points: [],
      /**
       * 点を追加する
       */
      addPoint: (point) =>
        set(
          (state) => {
            state.points.push({ ...point, id: crypto.randomUUID() });
          },
          false,
          "addPoint",
        ),
      /**
       * 点を削除する
       */
      removePoint: (id) =>
        set(
          (state) => {
            state.points = state.points.filter((point) => point.id !== id);
          },
          false,
          "removePoint",
        ),
      /**
       * 点を編集する
       */
      editPoint: (id, updates) =>
        set(
          (state) => {
            state.points = state.points.map((point) =>
              point.id === id ? { ...point, ...updates } : point,
            );
          },
          false,
          "editPoint",
        ),
    })),
  ),
);
