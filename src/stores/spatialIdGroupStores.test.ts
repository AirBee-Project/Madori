import { RangeId } from "@airbee-project/kasane-client/spatial-id";
import { beforeEach, describe, expect, it } from "vitest";
import type { SpatialIdGroup } from "../types/geometry/spatioTemporalId/spatialIdGroup";
import { useSpatialIdGroupStore } from "./spatialIdGroupStores";

describe("useSpatialIdGroupStore", () => {
  // 各テストの前にStoreを初期化する
  beforeEach(() => {
    useSpatialIdGroupStore.setState({ spatialIdGroups: new Map() });
  });

  it("初期状態では空間IDグループは空であること", () => {
    const state = useSpatialIdGroupStore.getState();
    expect(state.spatialIdGroups.size).toBe(0);
  });

  describe("addSpatialIdGroup", () => {
    it("正当なデータを与えた場合、グループが追加され success が true になること", () => {
      const state = useSpatialIdGroupStore.getState();
      const validGroup: Omit<SpatialIdGroup, "id"> = {
        color: { r: 255, g: 0, b: 0, a: 255 },
        spatialIds: [RangeId.create(20, 22, 33, 44)],
      };

      const result = state.addSpatialIdGroup(validGroup);

      // Zodパースの成功確認
      expect(result.success).toBe(true);

      // Storeの更新確認
      const updatedState = useSpatialIdGroupStore.getState();
      expect(updatedState.spatialIdGroups.size).toBe(1);

      // 追加されたデータを取得して確認
      const addedGroup = Array.from(updatedState.spatialIdGroups.values())[0];
      expect(addedGroup.color).toEqual(validGroup.color);
      expect(addedGroup.spatialIds).toEqual(validGroup.spatialIds);
      expect(typeof addedGroup.id).toBe("string"); // idが自動生成されているか
    });

    it("不正なデータ（色が範囲外）を与えた場合、エラーが返され Store は更新されないこと", () => {
      const state = useSpatialIdGroupStore.getState();
      const invalidGroup = {
        color: { r: 300, g: 0, b: 0, a: 255 }, // rが255を超えている
        spatialIds: [],
      } as unknown as Omit<SpatialIdGroup, "id">;

      const result = state.addSpatialIdGroup(invalidGroup);

      // Zodパースの失敗確認
      expect(result.success).toBe(false);

      // Storeが更新されていないことの確認
      const updatedState = useSpatialIdGroupStore.getState();
      expect(updatedState.spatialIdGroups.size).toBe(0);
    });

    it("不正なデータ（空間IDが不正）を与えた場合、エラーが返され Store は更新されないこと", () => {
      const state = useSpatialIdGroupStore.getState();
      const invalidGroup = {
        color: { r: 255, g: 255, b: 255, a: 255 },
        spatialIds: [
          { z: 0, f: 0, x: 0, y: 2 }, // RangeId のインスタンスではない
        ],
      } as unknown as Omit<SpatialIdGroup, "id">;

      const result = state.addSpatialIdGroup(invalidGroup);

      expect(result.success).toBe(false);
      const updatedState = useSpatialIdGroupStore.getState();
      expect(updatedState.spatialIdGroups.size).toBe(0);
    });
  });

  describe("removeSpatialIdGroup", () => {
    it("指定したIDのグループを削除できること", () => {
      const state = useSpatialIdGroupStore.getState();

      // テストデータの追加
      state.addSpatialIdGroup({
        color: { r: 0, g: 255, b: 0, a: 255 },
        spatialIds: [],
      });

      const updatedState1 = useSpatialIdGroupStore.getState();
      expect(updatedState1.spatialIdGroups.size).toBe(1);

      const addedId = Array.from(updatedState1.spatialIdGroups.keys())[0];

      // 削除
      updatedState1.removeSpatialIdGroup(addedId);

      const updatedState2 = useSpatialIdGroupStore.getState();
      expect(updatedState2.spatialIdGroups.size).toBe(0);
      expect(updatedState2.spatialIdGroups.has(addedId)).toBe(false);
    });
  });

  describe("editSpatialIdGroup", () => {
    it("存在するグループのプロパティを更新できること", () => {
      const state = useSpatialIdGroupStore.getState();

      // テストデータの追加
      state.addSpatialIdGroup({
        color: { r: 0, g: 0, b: 255, a: 255 },
        spatialIds: [RangeId.create(10, 0, 0, 0)],
      });

      const updatedState1 = useSpatialIdGroupStore.getState();
      const addedId = Array.from(updatedState1.spatialIdGroups.keys())[0];

      // 更新データの適用 (色だけを変更)
      const editResult = updatedState1.editSpatialIdGroup(addedId, {
        color: { r: 255, g: 255, b: 0, a: 128 },
      });

      expect(editResult.success).toBe(true);

      const updatedState2 = useSpatialIdGroupStore.getState();
      const editedGroup = updatedState2.spatialIdGroups.get(addedId);
      expect(editedGroup).toBeDefined();

      if (editedGroup) {
        // 引数に渡したカラーが更新されていること
        expect(editedGroup.color).toEqual({ r: 255, g: 255, b: 0, a: 128 });
        // 渡していない spatialIds が元のままであること
        expect(editedGroup.spatialIds).toEqual([RangeId.create(10, 0, 0, 0)]);
      }
    });

    it("不正な更新データを渡した場合は更新されずエラーが返ること", () => {
      const state = useSpatialIdGroupStore.getState();

      state.addSpatialIdGroup({
        color: { r: 0, g: 0, b: 255, a: 255 },
        spatialIds: [],
      });

      const updatedState1 = useSpatialIdGroupStore.getState();
      const addedId = Array.from(updatedState1.spatialIdGroups.keys())[0];

      // RangeId のインスタンスではないデータを渡す
      const editResult = updatedState1.editSpatialIdGroup(addedId, {
        spatialIds: [{ z: 0, f: 0, x: 0, y: 1 } as unknown as RangeId],
      });

      expect(editResult.success).toBe(false);

      const updatedState2 = useSpatialIdGroupStore.getState();
      const editedGroup = updatedState2.spatialIdGroups.get(addedId);
      expect(editedGroup).toBeDefined();

      if (editedGroup) {
        // 元のデータが維持されていることの確認
        expect(editedGroup.spatialIds).toEqual([]);
      }
    });

    it("存在しないIDを更新しようとした場合は成功するがStoreには変化がないこと", () => {
      const state = useSpatialIdGroupStore.getState();

      const editResult = state.editSpatialIdGroup("dummy-id", {
        color: { r: 255, g: 255, b: 0, a: 128 },
      });

      // Zodによるスキーマ検証自体は成功する
      expect(editResult.success).toBe(true);

      const updatedState = useSpatialIdGroupStore.getState();
      expect(updatedState.spatialIdGroups.size).toBe(0); // 新たに追加されたりしないこと
    });
  });
});
