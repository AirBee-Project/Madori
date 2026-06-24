import { enableMapSet } from "immer";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { SpatialIdGroup } from "../types/geometry/spatioTemporalId/spatialIdGroup";
import {
  SpatialIdGroupPartialSchema,
  SpatialIdGroupWithoutIdSchema,
} from "../types/geometry/spatioTemporalId/spatialIdGroup";

enableMapSet();

interface SpatialIdGroupState {
  spatialIdGroups: Map<string, SpatialIdGroup>;
  rangeMode: boolean;
  showBorder: boolean;
  pickable: boolean;
}

interface SpatialIdGroupAction {
  addSpatialIdGroup: (
    group: Omit<SpatialIdGroup, "id">,
  ) => ReturnType<typeof SpatialIdGroupWithoutIdSchema.safeParse>;
  removeSpatialIdGroup: (id: string) => void;
  editSpatialIdGroup: (
    id: string,
    updates: Partial<SpatialIdGroup>,
  ) => ReturnType<typeof SpatialIdGroupPartialSchema.safeParse>;
  toggleRangeMode: () => void;
  toggleBorder: () => void;
  togglePicking: () => void;
}

/**
 * 空間IDグループの状態管理フック
 */
export const useSpatialIdGroupStore = create<
  SpatialIdGroupState & SpatialIdGroupAction
>()(
  devtools(
    immer((set) => ({
      // 初期状態
      spatialIdGroups: new Map(),
      rangeMode: true,
      showBorder: false,
      pickable: false,

      /**
       * 空間IDグループを追加する
       *
       * グループ内の空間ID (`spatialIds`) に1つでも不正なデータが含まれている場合、
       * Zodのバリデーションエラーとなり、グループ全体の追加が失敗します。
       */
      addSpatialIdGroup: (group) => {
        const result = SpatialIdGroupWithoutIdSchema.safeParse(group);
        if (result.success) {
          set(
            (state) => {
              const newId = crypto.randomUUID();
              state.spatialIdGroups.set(newId, { ...result.data, id: newId });
            },
            false,
            "addSpatialIdGroup",
          );
        }
        return result;
      },

      /**
       * 空間IDグループを削除する
       */
      removeSpatialIdGroup: (id) =>
        set(
          (state) => {
            state.spatialIdGroups.delete(id);
          },
          false,
          "removeSpatialIdGroup",
        ),

      /**
       * 空間IDグループを編集する
       *
       * 更新データ内の空間ID (`spatialIds`) に1つでも不正なデータが含まれている場合、
       * Zodのバリデーションエラーとなり、グループ全体の更新が失敗します。
       */
      editSpatialIdGroup: (id, updates) => {
        const result = SpatialIdGroupPartialSchema.safeParse(updates);
        if (result.success) {
          set(
            (state) => {
              const targetGroup = state.spatialIdGroups.get(id);
              if (targetGroup) {
                state.spatialIdGroups.set(id, {
                  ...targetGroup,
                  ...result.data,
                });
              }
            },
            false,
            "editSpatialIdGroup",
          );
        }
        return result;
      },

      /**
       * 範囲結合表示と個別セル展開表示をトグルする
       */
      toggleRangeMode: () =>
        set(
          (state) => {
            state.rangeMode = !state.rangeMode;
          },
          false,
          "toggleRangeMode",
        ),

      /**
       * 空間IDの枠線表示をトグルする
       */
      toggleBorder: () =>
        set(
          (state) => {
            state.showBorder = !state.showBorder;
          },
          false,
          "toggleBorder",
        ),

      /**
       * ボクセルのpicking（ホバー判定・ツールチップ等）をトグルする
       * 大量描画時にOFFにすると軽量化できる
       */
      togglePicking: () =>
        set(
          (state) => {
            state.pickable = !state.pickable;
          },
          false,
          "togglePicking",
        ),
    })),
  ),
);
