import { useKasaneStore } from "../../stores/kasaneStore";
import styles from "./KasaneLoadingOverlay.module.scss";

/**
 * Kasaneの読み込み状態を地図上に可視化するオーバーレイ。
 * - 読み込み中: 表示領域（ビューポート）全体を縁取ってパルス＋バッジ表示
 * - 範囲が広すぎる場合: 案内（notice）をバッジ表示
 * UIのみ（追加の状態は持たず、kasaneStore を購読するだけ）。
 */
export default function KasaneLoadingOverlay() {
  const loading = useKasaneStore((s) => s.loading);
  const notice = useKasaneStore((s) => s.notice);
  const selectedTable = useKasaneStore((s) => s.selectedTable);

  if (!selectedTable) return null;
  if (!loading && !notice) return null;

  return (
    <>
      {loading && <div className={styles.frame} aria-hidden="true" />}
      <output className={styles.badge}>
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        <span>{loading ? "Kasane 表示領域を読み込み中…" : notice}</span>
      </output>
    </>
  );
}
