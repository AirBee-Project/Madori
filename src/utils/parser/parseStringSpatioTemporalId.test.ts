import { describe, expect, it } from "vitest";
import { parseStringSpatioTemporalId } from "./parseStringSpatioTemporalId";

describe("parseStringSpatioTemporalId", () => {
  it("有効な空間IDのみをパースできること", () => {
    const result = parseStringSpatioTemporalId("20/22/33/44");
    expect(result.errors).toHaveLength(0);
    expect(result.success).toHaveLength(1);
    expect(result.success[0]).toEqual({
      spatialId: { z: 20, f: 22, x: 33, y: 44 },
    });
  });

  it("有効な空間IDと時間IDを持つ文字列をパースできること", () => {
    const result = parseStringSpatioTemporalId("20/22/33/44_1/1000");
    expect(result.errors).toHaveLength(0);
    expect(result.success).toHaveLength(1);
    expect(result.success[0]).toEqual({
      spatialId: { z: 20, f: 22, x: 33, y: 44 },
      temporalId: { i: 1, t: 1000 },
    });
  });

  it("範囲記法を含む有効なIDをパースできること", () => {
    const result = parseStringSpatioTemporalId("20/22:25/33/44:48_1/100:200");
    expect(result.errors).toHaveLength(0);
    expect(result.success).toHaveLength(1);
    expect(result.success[0]).toEqual({
      spatialId: { z: 20, f: [22, 25], x: 33, y: [44, 48] },
      temporalId: { i: 1, t: [100, 200] },
    });
  });

  it("カンマ区切りで複数の有効なIDをパースできること", () => {
    const result = parseStringSpatioTemporalId("20/22/33/44_1/1000 , 21/5/6/7");
    expect(result.errors).toHaveLength(0);
    expect(result.success).toHaveLength(2);
    expect(result.success[0]).toEqual({
      spatialId: { z: 20, f: 22, x: 33, y: 44 },
      temporalId: { i: 1, t: 1000 },
    });
    expect(result.success[1]).toEqual({
      spatialId: { z: 21, f: 5, x: 6, y: 7 },
    });
  });

  it("空のトークンを無視すること", () => {
    const result = parseStringSpatioTemporalId("20/22/33/44, ,, ");
    expect(result.errors).toHaveLength(0);
    expect(result.success).toHaveLength(1);
  });

  it("複数のアンダースコアが使用されている場合はエラーを返すこと", () => {
    const result = parseStringSpatioTemporalId("20/22/33/44_1/100_2");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].content).toBe("20/22/33/44_1/100_2");
    expect(result.errors[0].message).toBe(
      "形式が不正です。アンダースコア(_)は1つのみ使用可能です。",
    );
  });

  it("空間要素の数が不正な場合はエラーを返すこと", () => {
    const result = parseStringSpatioTemporalId("20/22/33");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe(
      "空間IDの要素数が不正です。{z}/{f}/{x}/{y} の形式で指定してください。",
    );
  });

  it("時間要素の数が不正な場合はエラーを返すこと", () => {
    const result = parseStringSpatioTemporalId("20/22/33/44_1");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe(
      "時間IDの要素数が不正です。{i}/{t} の形式で指定してください。",
    );
  });

  it("数値以外の値が使用されている場合はエラーを返すこと", () => {
    const result = parseStringSpatioTemporalId("20/a/33/44");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe(
      "fは数値として正しくパースできません。",
    );
  });

  it("空間インデックスが範囲外の場合はエラーを返すこと", () => {
    const result = parseStringSpatioTemporalId("0/0/0/1");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("yインデックスは");
  });

  it("日本語などの全角文字が混入している場合はエラーを返すこと", () => {
    // 空間ID部分に日本語
    const result1 = parseStringSpatioTemporalId("20/あ/33/44");
    expect(result1.errors).toHaveLength(1);
    expect(result1.errors[0].message).toBe(
      "fは数値として正しくパースできません。",
    );

    // 時間ID部分に日本語
    const result2 = parseStringSpatioTemporalId("20/22/33/44_1/あ");
    expect(result2.errors).toHaveLength(1);
    expect(result2.errors[0].message).toBe(
      "tは数値として正しくパースできません。",
    );
  });

  it("空間要素の数が多すぎる・少なすぎる場合はエラーを返すこと", () => {
    // 少なすぎる場合 (既存の確認) は要素数エラー
    const resultFew = parseStringSpatioTemporalId("20/22/33");
    expect(resultFew.errors).toHaveLength(1);
    expect(resultFew.errors[0].message).toContain("空間IDの要素数が不正です");

    // 多すぎる場合
    const resultMany = parseStringSpatioTemporalId("20/22/33/44/55");
    expect(resultMany.errors).toHaveLength(1);
    expect(resultMany.errors[0].message).toContain("空間IDの要素数が不正です");
  });

  it("時間要素の数が多すぎる・少なすぎる場合はエラーを返すこと", () => {
    // 少なすぎる場合 (時間要素が1つ)
    const resultFew = parseStringSpatioTemporalId("20/22/33/44_1");
    expect(resultFew.errors).toHaveLength(1);
    expect(resultFew.errors[0].message).toContain("時間IDの要素数が不正です");

    // 多すぎる場合
    const resultMany = parseStringSpatioTemporalId("20/22/33/44_1/100/200");
    expect(resultMany.errors).toHaveLength(1);
    expect(resultMany.errors[0].message).toContain("時間IDの要素数が不正です");
  });

  it("範囲記法の指定で複数のコロンがある場合はエラーを返すこと", () => {
    const result = parseStringSpatioTemporalId("20/22:25:28/33/44");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe(
      "fは範囲記法が正しくパースできません。",
    );
  });

  it("範囲指定が逆転している場合に適切なエラーを返すこと", () => {
    // fの指定が min > max になっている
    const resultSpatial = parseStringSpatioTemporalId("20/25:22/33/44");
    expect(resultSpatial.errors).toHaveLength(1);
    expect(resultSpatial.errors[0].message).toContain("f の範囲指定が不正です");

    // tの指定が min > max になっている
    const resultTemporal = parseStringSpatioTemporalId("20/22/33/44_1/200:100");
    expect(resultTemporal.errors).toHaveLength(1);
    expect(resultTemporal.errors[0].message).toContain(
      "開始時刻と終了時刻の順序が逆です",
    );
  });

  it("複数個の有効な入力をまとめてパースできること", () => {
    const result = parseStringSpatioTemporalId(
      "20/22/33/44, 21/1/2/3_4/5, 22/6:7/8/9:10_11/12:13",
    );

    expect(result.errors).toHaveLength(0);
    expect(result.success).toHaveLength(3);
    expect(result.success[0]).toEqual({
      spatialId: { z: 20, f: 22, x: 33, y: 44 },
    });
    expect(result.success[1]).toEqual({
      spatialId: { z: 21, f: 1, x: 2, y: 3 },
      temporalId: { i: 4, t: 5 },
    });
    expect(result.success[2]).toEqual({
      spatialId: { z: 22, f: [6, 7], x: 8, y: [9, 10] },
      temporalId: { i: 11, t: [12, 13] },
    });
  });

  it("複数個の入力で成功と失敗が混在してもそれぞれ分離して扱えること", () => {
    const result = parseStringSpatioTemporalId(
      "20/22/33/44, 20/a/33/44, 21/1/2/3_4/5, 22/6/7/8_9/x",
    );

    expect(result.success).toHaveLength(2);
    expect(result.errors).toHaveLength(2);
    expect(result.success[0]).toEqual({
      spatialId: { z: 20, f: 22, x: 33, y: 44 },
    });
    expect(result.success[1]).toEqual({
      spatialId: { z: 21, f: 1, x: 2, y: 3 },
      temporalId: { i: 4, t: 5 },
    });
    expect(result.errors[0].content).toBe("20/a/33/44");
    expect(result.errors[0].message).toBe(
      "fは数値として正しくパースできません。",
    );
    expect(result.errors[1].content).toBe("22/6/7/8_9/x");
    expect(result.errors[1].message).toBe(
      "tは数値として正しくパースできません。",
    );
  });

  it("複数個の入力で空白や空要素を除外して正しく扱えること", () => {
    const result = parseStringSpatioTemporalId(
      " , 20/22/33/44 , , 21/1/2/3_4/5 , ",
    );

    expect(result.errors).toHaveLength(0);
    expect(result.success).toHaveLength(2);
    expect(result.success[0]).toEqual({
      spatialId: { z: 20, f: 22, x: 33, y: 44 },
    });
    expect(result.success[1]).toEqual({
      spatialId: { z: 21, f: 1, x: 2, y: 3 },
      temporalId: { i: 4, t: 5 },
    });
  });
});
