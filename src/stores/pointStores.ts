import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Point } from "../types/point";

interface PointState {
  points: Point[];
}

interface PointAction {
  addPoint: (point: Point) => void;
  removePoint: (id: string) => void;
  editPoint: (id: string, newPoint: Partial<Point>) => void;
}

/**
 * 点の状態管理フック
 */
export const usePointStore = create<PointState & PointAction>()(
  devtools(
    immer((set) => ({
      //初期状態は空の配列
      points: [],
      /**
       * 配列に点を追加する関数
       */
      addPoint: (point) =>
        set(
          (state) => {
            state.points.push(point);
          },
          false,
          "addPoint",
        ),
      /**
       * 配列から点を削除する関数
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
       * 配列中の点を編集する関数
       */
      editPoint: (id, newPoint) =>
        set(
          (state) => {
            state.points = state.points.map((point) =>
              point.id === id ? { ...point, ...newPoint } : point,
            );
          },
          false,
          "editPoint",
        ),
    })),
  ),
);
