/**
 * Kasane API の接続設定（環境変数から読み込み）。
 *
 * ローカル環境の場合、CORS（ブラウザのセキュリティ機能） エラー回避処理も行う
 */
const apiUrl = (import.meta.env.VITE_KASANE_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);
/**
 * 接続設定
 */
export const kasaneConfig = {
  baseUrl: import.meta.env.DEV ? "/kasane" : apiUrl,
  username: import.meta.env.VITE_KASANE_USERNAME ?? "",
  password: import.meta.env.VITE_KASANE_PASSWORD ?? "",
} as const;

/**
 * チェック
 */
export function isKasaneConfigured(): boolean {
  return Boolean(apiUrl && kasaneConfig.username && kasaneConfig.password);
}
