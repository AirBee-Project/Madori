import type { z } from "zod";
import { clearToken, ensureToken } from "./auth";
import { kasaneConfig } from "./config";

type RequestOptions<T> = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  schema?: z.ZodType<T>;
};

/**
 * Kasane API への fetch ラッパ。
 * - baseURL（URLの頭） 付与、Bearer（JWTトークンの前につける） トークン注入
 * - 401 受信時はトークンを破棄して1回だけ再ログイン・リトライ
 * - AbortSignal（キャンセル）対応、レスポンスを zod で検証
 */
export async function kasaneFetch<T>(
  path: string,
  options: RequestOptions<T> = {},
): Promise<T> {
  const { method = "GET", body, signal, schema } = options;

  const doFetch = (token: string) =>
    fetch(`${kasaneConfig.baseUrl}${path}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch(await ensureToken());

  if (res.status === 401) {
    clearToken();
    res = await doFetch(await ensureToken());
  }

  if (!res.ok) {
    throw new Error(
      `Kasane API エラー (HTTP ${res.status}): ${method} ${path}`,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const json = await res.json();
  return schema ? schema.parse(json) : (json as T);
}
