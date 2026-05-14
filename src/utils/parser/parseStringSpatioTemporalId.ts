import { err, ok, type Result } from "../../types/core/result";
import {
  type SpatialId,
  SpatialIdSchema,
  type SpatioTemporalId,
  SpatioTemporalIdSchema,
  type TemporalId,
  TemporalIdSchema,
} from "../../types/geometry/spatioTemporalId";

/**
 * パース関数のエラー型
 */
export type ParseStringSpatioTemporalIdError = {
  /** エラーとなった文字列 */
  content: string;
  /** エラーメッセージ */
  message: string;
};

/**
 * パース関数の結果型
 */
export type ParseStringSpatioTemporalIdResult = {
  /** パースに成功した時空間ID */
  success: SpatioTemporalId[];
  /** エラーの情報 */
  errors: ParseStringSpatioTemporalIdError[];
};

/**
 * 大量の時空間IDの文字列表記から
 * {@link SpatioTemporalId SpatioTemporalId型}
 * へのパースを行う関数
 */
export function parseStringSpatioTemporalId(
  target: string,
): ParseStringSpatioTemporalIdResult {
  // 結果の初期化
  const result: ParseStringSpatioTemporalIdResult = {
    success: [],
    errors: [],
  };

  //カンマ区切り
  const rawTokens = target
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const token of rawTokens) {
    // 空間IDと時間IDの分離
    const parts = token.split("_");
    if (parts.length > 2) {
      result.errors.push({
        content: token,
        message: "形式が不正です。アンダースコア(_)は1つのみ使用可能です。",
      });
      continue;
    }

    const [spatialStr, temporalStr] = parts;

    // 空間IDのパース
    const spatialIdResult = parseSpatialPart(spatialStr);
    if (!spatialIdResult.success) {
      result.errors.push({
        content: token,
        message: spatialIdResult.error,
      });
      continue;
    }
    const spatialIdData = spatialIdResult.result;

    // 時間IDがない場合は空間IDのみで結果に挿入
    if (temporalStr === undefined) {
      const spResult = SpatioTemporalIdSchema.safeParse({
        spatialId: spatialIdData,
      });

      if (spResult.success) {
        result.success.push(spResult.data);
      } else {
        result.errors.push({ content: token, message: spResult.error.message });
      }
      continue;
    }

    // 時間IDのパース
    const temporalIdResult = parseTemporalPart(temporalStr);
    if (!temporalIdResult.success) {
      result.errors.push({
        content: token,
        message: temporalIdResult.error,
      });
      continue;
    }
    const temporalIdData = temporalIdResult.result;

    const spatioTemporalIdResult = SpatioTemporalIdSchema.safeParse({
      spatialId: spatialIdData,
      temporalId: temporalIdData,
    });

    if (spatioTemporalIdResult.success) {
      result.success.push(spatioTemporalIdResult.data);
    } else {
      result.errors.push({
        content: token,
        message: spatioTemporalIdResult.error.message,
      });
    }
  }

  return result;
}

/**
 * 空間IDのパース関数
 */
function parseSpatialPart(spatialStr: string): Result<SpatialId, string> {
  const elements = spatialStr.split("/");
  if (elements.length !== 4) {
    return err(
      "空間IDの要素数が不正です。{z}/{f}/{x}/{y} の形式で指定してください。",
    );
  }

  const z = parseInt(elements[0], 10);
  if (Number.isNaN(z)) {
    return err("zは数値として正しくパースできません。");
  }

  const f = parseRangeNotation(elements[1]);
  const x = parseRangeNotation(elements[2]);
  const y = parseRangeNotation(elements[3]);

  if (!f.success) {
    return err(`fは${f.error}`);
  }
  if (!x.success) {
    return err(`xは${x.error}`);
  }
  if (!y.success) {
    return err(`yは${y.error}`);
  }

  const spatialIdResult = SpatialIdSchema.safeParse({
    z: z,
    f: f.result,
    x: x.result,
    y: y.result,
  });

  if (!spatialIdResult.success) {
    return err(spatialIdResult.error.message);
  }

  return ok(spatialIdResult.data);
}

/**
 * 時間IDのパース関数
 */
function parseTemporalPart(temporalStr: string): Result<TemporalId, string> {
  const elements = temporalStr.split("/");
  if (elements.length !== 2) {
    return err("時間IDの要素数が不正です。{i}/{t} の形式で指定してください。");
  }

  const i = parseInt(elements[0], 10);
  if (Number.isNaN(i)) {
    return err("iは数値として正しくパースできません。");
  }

  const t = parseRangeNotation(elements[1]);
  if (!t.success) {
    return err(`tは${t.error}`);
  }

  const temporalIdResult = TemporalIdSchema.safeParse({
    i: i,
    t: t.result,
  });

  if (!temporalIdResult.success) {
    return err(temporalIdResult.error.message);
  }

  return ok(temporalIdResult.data);
}

/**
 * `X1`,`X1:X2`の範囲記法をnumberか[number,number]に変換する。
 * エラーの場合はエラーメッセージを返す。
 */
function parseRangeNotation(
  target: string,
): Result<number | [number, number], string> {
  const splited = target.split(":");

  if (splited.length > 2) {
    return err("範囲記法が正しくパースできません。");
  }

  if (splited.length === 1) {
    const val = parseInt(splited[0], 10);
    if (Number.isNaN(val)) {
      return err("数値として正しくパースできません。");
    }
    return ok(val);
  }

  const min = parseInt(splited[0], 10);
  const max = parseInt(splited[1], 10);

  if (Number.isNaN(min) || Number.isNaN(max)) {
    return err("数値として正しくパースできません。");
  }

  return ok([min, max]);
}
