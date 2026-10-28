import { enableMapSet } from "immer";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { GraphGroup } from "../types/geometry/graph";
import {
  GraphGroupPartialSchema,
  GraphGroupWithoutIdSchema,
} from "../types/geometry/graph";

enableMapSet();

interface GraphGroupState {
  graphGroups: Map<string, GraphGroup>;
}

interface GraphGroupAction {
  addGraphGroup: (
    group: Omit<GraphGroup, "id">,
  ) => ReturnType<typeof GraphGroupWithoutIdSchema.safeParse>;
  removeGraphGroup: (id: string) => void;
  editGraphGroup: (
    id: string,
    updates: Partial<GraphGroup>,
  ) => ReturnType<typeof GraphGroupPartialSchema.safeParse>;
}

/**
 * グラフ（頂点・エッジ）グループの状態管理フック
 */
export const useGraphGroupStore = create<GraphGroupState & GraphGroupAction>()(
  devtools(
    immer((set) => ({
      graphGroups: new Map(),

      /**
       * グラフグループを追加する
       */
      addGraphGroup: (group) => {
        const result = GraphGroupWithoutIdSchema.safeParse(group);
        if (result.success) {
          set(
            (state) => {
              const newId = crypto.randomUUID();
              state.graphGroups.set(newId, { ...result.data, id: newId });
            },
            false,
            "addGraphGroup",
          );
        }
        return result;
      },

      /**
       * グラフグループを削除する
       */
      removeGraphGroup: (id) =>
        set(
          (state) => {
            state.graphGroups.delete(id);
          },
          false,
          "removeGraphGroup",
        ),

      /**
       * グラフグループを編集する
       */
      editGraphGroup: (id, updates) => {
        const result = GraphGroupPartialSchema.safeParse(updates);
        if (result.success) {
          set(
            (state) => {
              const target = state.graphGroups.get(id);
              if (target) {
                state.graphGroups.set(id, { ...target, ...result.data });
              }
            },
            false,
            "editGraphGroup",
          );
        }
        return result;
      },
    })),
  ),
);
