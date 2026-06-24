import { kasaneConfig } from "./config";
import { LoginResponseSchema } from "./types";

/**
 * Kasane の JWT をメモリにキャッシュして管理する。
 * env の資格情報で自動ログインし、失効/401時に再取得する。
 * （localStorage には保存せず、リロードで再ログインする）
 */

let tokenCache: { token: string; expMs: number } | null = null;
let inflight: Promise<string> | null = null;

/** JWT の有効期限をデコード。失敗時は null。 */
function decodeJwtExpMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function login(): Promise<string> {
  const res = await fetch(`${kasaneConfig.baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: kasaneConfig.username,
      password: kasaneConfig.password,
    }),
  });
  if (!res.ok) {
    throw new Error(`Kasane ログインに失敗しました (HTTP ${res.status})`);
  }
  const { token } = LoginResponseSchema.parse(await res.json());
  // exp 不明時は 50 分の暫定有効期限
  const expMs = decodeJwtExpMs(token) ?? Date.now() + 50 * 60 * 1000;
  tokenCache = { token, expMs };
  return token;
}

/**
 * 有効なトークンを返す。無ければ/失効していればログインする。
 * 同時呼び出しは1回のログインに集約する。
 */
export async function ensureToken(): Promise<string> {
  if (tokenCache && tokenCache.expMs - 60_000 > Date.now()) {
    return tokenCache.token;
  }
  if (!inflight) {
    inflight = login().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

/** トークンを破棄する（401受信時など）。 */
export function clearToken(): void {
  tokenCache = null;
}
