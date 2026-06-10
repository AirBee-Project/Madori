import { describe, expect, it } from "vitest";
import type { SpatialId } from "../../types/geometry/spatioTemporalId";
import { parseSpatialIdToVoxels } from "./parseSpatialIdToVoxels";

describe("parseSpatialIdToVoxels (rangeMode = true / 範囲結合モード)", () => {
  it("範囲表記を含まないIDの場合、1x1x1サイズの SpatialVoxel が1つ返されること", () => {
    const input: SpatialId = {
      z: 10,
      f: 5,
      x: 100,
      y: 200,
      temporalId: {
        i: 60,
        t: 12345,
      },
    };

    const result = parseSpatialIdToVoxels(input, true);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      z: 10,
      fMin: 5,
      fMax: 5,
      xMin: 100,
      xMax: 100,
      yMin: 200,
      yMax: 200,
      temporalId: {
        i: 60,
        tMin: 12345,
        tMax: 12345,
      },
    });
  });

  it("各軸に範囲表記がある場合、単一の結合されたボクセルが返されること", () => {
    const input: SpatialId = {
      z: 10,
      f: [1, 3],
      x: [100, 105],
      y: [200, 202],
      temporalId: {
        i: 3600,
        t: [50, 52],
      },
    };

    const result = parseSpatialIdToVoxels(input, true);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      z: 10,
      fMin: 1,
      fMax: 3,
      xMin: 100,
      xMax: 105,
      yMin: 200,
      yMax: 202,
      temporalId: {
        i: 3600,
        tMin: 50,
        tMax: 52,
      },
    });
  });

  it("Xに回り込みの範囲表現がある場合、2つのボクセルに分割されること", () => {
    const input: SpatialId = {
      z: 2, // 2^2 = 4 (Xは 0〜3)
      f: 0,
      x: [3, 1], // 3 から 0, 1 へ回り込み
      y: 0,
    };

    const result = parseSpatialIdToVoxels(input, true);
    expect(result).toHaveLength(2);

    // ボクセル1: 3から末尾(3)まで
    expect(result[0]).toEqual({
      z: 2,
      fMin: 0,
      fMax: 0,
      xMin: 3,
      xMax: 3,
      yMin: 0,
      yMax: 0,
      temporalId: undefined,
    });

    // ボクセル2: 0から1まで
    expect(result[1]).toEqual({
      z: 2,
      fMin: 0,
      fMax: 0,
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 0,
      temporalId: undefined,
    });
  });
});

describe("parseSpatialIdToVoxels (rangeMode = false / セル展開モード)", () => {
  it("範囲表現を一切含まないIDの場合、1x1x1サイズの SpatialVoxel が1つだけ展開されて返されること", () => {
    const input: SpatialId = {
      z: 10,
      f: 5,
      x: 100,
      y: 200,
      temporalId: {
        i: 60,
        t: 12345,
      },
    };

    const result = parseSpatialIdToVoxels(input, false);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      z: 10,
      fMin: 5,
      fMax: 5,
      xMin: 100,
      xMax: 100,
      yMin: 200,
      yMax: 200,
      temporalId: {
        i: 60,
        tMin: 12345,
        tMax: 12345,
      },
    });
  });

  it("特定の1軸（例：Y軸のみ）に範囲表現がある場合、指定された数だけ正しく展開されること", () => {
    const input: SpatialId = {
      z: 5,
      f: 2,
      x: 10,
      y: [20, 22], // 20, 21, 22
    };

    const result = parseSpatialIdToVoxels(input, false);
    expect(result).toHaveLength(3);

    expect(result[0]).toEqual({
      z: 5,
      fMin: 2,
      fMax: 2,
      xMin: 10,
      xMax: 10,
      yMin: 20,
      yMax: 20,
      temporalId: undefined,
    });
    expect(result[1]).toEqual({
      z: 5,
      fMin: 2,
      fMax: 2,
      xMin: 10,
      xMax: 10,
      yMin: 21,
      yMax: 21,
      temporalId: undefined,
    });
    expect(result[2]).toEqual({
      z: 5,
      fMin: 2,
      fMax: 2,
      xMin: 10,
      xMax: 10,
      yMin: 22,
      yMax: 22,
      temporalId: undefined,
    });
  });

  it("展開時のループ順序（F -> X -> Y -> T）の組み合わせが正しい順序で生成されること", () => {
    const input: SpatialId = {
      z: 8,
      f: [1, 2],
      x: [10, 11],
      y: 3,
    };

    // F(1,2) * X(10,11) * Y(3) = 4通り
    // 期待される並び:
    // 1. f=1, x=10, y=3
    // 2. f=1, x=11, y=3
    // 3. f=2, x=10, y=3
    // 4. f=2, x=11, y=3
    const result = parseSpatialIdToVoxels(input, false);
    expect(result).toHaveLength(4);

    expect(result[0].fMin).toBe(1);
    expect(result[0].xMin).toBe(10);
    expect(result[1].fMin).toBe(1);
    expect(result[1].xMin).toBe(11);
    expect(result[2].fMin).toBe(2);
    expect(result[2].xMin).toBe(10);
    expect(result[3].fMin).toBe(2);
    expect(result[3].xMin).toBe(11);
  });

  it("範囲表現を持つIDが、1x1x1サイズの複数のボクセルに展開されて返されること", () => {
    const input: SpatialId = {
      z: 10,
      f: [1, 2],
      x: 100,
      y: [10, 11],
      temporalId: {
        i: 60,
        t: [100, 101],
      },
    };

    const result = parseSpatialIdToVoxels(input, false);
    // f(2通り) * y(2通り) * t(2通り) = 8個のボクセル
    expect(result).toHaveLength(8);

    // すべての要素のサイズが 1x1x1 になっていることの検証
    for (const voxel of result) {
      expect(voxel.fMin).toBe(voxel.fMax);
      expect(voxel.xMin).toBe(voxel.xMax);
      expect(voxel.yMin).toBe(voxel.yMax);
      expect(voxel.temporalId?.tMin).toBe(voxel.temporalId?.tMax);
    }

    // 最初のボクセル
    expect(result[0]).toEqual({
      z: 10,
      fMin: 1,
      fMax: 1,
      xMin: 100,
      xMax: 100,
      yMin: 10,
      yMax: 10,
      temporalId: {
        i: 60,
        tMin: 100,
        tMax: 100,
      },
    });

    // 最後のボクセル
    expect(result[7]).toEqual({
      z: 10,
      fMin: 2,
      fMax: 2,
      xMin: 100,
      xMax: 100,
      yMin: 11,
      yMax: 11,
      temporalId: {
        i: 60,
        tMin: 101,
        tMax: 101,
      },
    });
  });

  it("Xに回り込みの範囲表現がある場合も、正しく個別の1x1セルに展開されること", () => {
    const input: SpatialId = {
      z: 2,
      f: 0,
      x: [3, 1], // X: 3, 0, 1
      y: 0,
    };

    const result = parseSpatialIdToVoxels(input, false);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.xMin)).toEqual([3, 0, 1]);
    expect(result.every((r) => r.xMin === r.xMax)).toBe(true);
  });
});
