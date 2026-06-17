/**
 * Kasane API の接続設定（環境変数から読み込み）。
 *
 * 注意: Vite の VITE_* はビルド時にクライアントJSへ埋め込まれ閲覧可能。
 *       資格情報はここに隔離し、将来バックエンドプロキシへ移行しやすくしておく。
 *
 * CORS について:
 *   dev では Vite プロキシ（vite.config.ts の "/kasane"）経由で同一オリジン化し、
 *   ブラウザのCORS制約を回避する。本番(build)では実URLへ直接アクセスするため、
 *   サーバ側でCORSを許可する必要がある。
 */
const apiUrl = (import.meta.env.VITE_KASANE_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);

export const kasaneConfig = {
  baseUrl: import.meta.env.DEV ? "/kasane" : apiUrl,
  username: import.meta.env.VITE_KASANE_USERNAME ?? "",
  password: import.meta.env.VITE_KASANE_PASSWORD ?? "",
} as const;

/**
 * 接続に必要な環境変数が揃っているか。
 */
export function isKasaneConfigured(): boolean {
  return Boolean(apiUrl && kasaneConfig.username && kasaneConfig.password);
}
