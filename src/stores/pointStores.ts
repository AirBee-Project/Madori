import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Point } from "../types/point";

interface PointState {
  points: Point[];
}

interface PointAction {
  addPoint: (point: Point) => void;
  removePoint: (index: number) => void;
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
        set((state) => {
          state.points.push(point);
        }),
      /**
       * 配列から点を削除する関数
       */
      removePoint: (index) =>
        set((state) => {
          state.points.splice(index, 1);
        }),
    })),
  ),
);
