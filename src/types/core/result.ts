/**
 * 成功または失敗を表す結果型。
 *
 * 使い方:
 * - `ok(value)` で成功結果を返す
 * - `err(message)` で失敗結果を返す
 * - 呼び出し側は `success` の真偽で分岐する
 *
 * 例:
 * ```ts
 * const result: Result<number, string> = ok(42);
 * if (result.success) {
 *   console.log(result.result);
 * }
 * ```
 */
export type Result<T, E> =
  | { success: true; result: T }
  | { success: false; error: E };

/**
 * 成功結果を作成する。
 *
 * 例:
 * ```ts
 * const result = ok(42);
 * // { success: true, result: 42 }
 * ```
 */
export function ok<T, E = never>(result: T): Result<T, E> {
  return {
    success: true,
    result,
  };
}

/**
 * 失敗結果を作成する。
 *
 * 例:
 * ```ts
 * const result = err("入力が不正です。");
 * // { success: false, error: "入力が不正です。" }
 * ```
 */
export function err<T = never, E = unknown>(error: E): Result<T, E> {
  return {
    success: false,
    error,
  };
}
