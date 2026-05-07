import { enableMapSet } from "immer";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Point } from "../types/point";
import { PointPartialSchema, PointWithoutIdSchema } from "../types/point";

enableMapSet();

interface PointState {
  points: Map<string, Point>;
}

interface PointAction {
  addPoint: (
    point: Omit<Point, "id">,
  ) => ReturnType<typeof PointWithoutIdSchema.safeParse>;
  removePoint: (id: string) => void;
  editPoint: (
    id: string,
    updates: Partial<Point>,
  ) => ReturnType<typeof PointPartialSchema.safeParse>;
}

/**
 * 点の状態管理フック
 */
export const usePointStore = create<PointState & PointAction>()(
  devtools(
    immer((set) => ({
      //初期状態
      points: new Map(),
      /**
       * 点を追加する
       */
      addPoint: (point) => {
        const result = PointWithoutIdSchema.safeParse(point);
        if (result.success) {
          set(
            (state) => {
              const newId = crypto.randomUUID();
              state.points.set(newId, { ...result.data, id: newId });
            },
            false,
            "addPoint",
          );
        }
        return result;
      },

      /**
       * 点を削除する
       */
      removePoint: (id) =>
        set(
          (state) => {
            state.points.delete(id);
          },
          false,
          "removePoint",
        ),
      /**
       * 点を編集する
       */
      editPoint: (id, updates) => {
        const result = PointPartialSchema.safeParse(updates);
        if (result.success) {
          set(
            (state) => {
              const targetPoint = state.points.get(id);
              if (targetPoint) {
                state.points.set(id, { ...targetPoint, ...result.data });
              }
            },
            false,
            "editPoint",
          );
        }
        return result;
      },
    })),
  ),
);
