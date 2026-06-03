import styles from "./Panel.module.scss";

type CommonPanelProps = {
  children: React.ReactNode;
  footerButton?: React.ReactNode;
};

/**
 * 各featureで使用するパネル
 * スクロール可能なエリアと、フッターの操作ボタンエリアを持つ共通コンポーネント。featureごとのパネルはこれをベースに作る。
 */
export default function CommonPanel({
  children,
  footerButton,
}: CommonPanelProps) {
  return (
    <div className={styles.panelContainer}>
      <div className={styles.scrollArea}>
        <div className={styles.itemList}>{children}</div>
      </div>

      <div className={styles.footer}>{footerButton}</div>
    </div>
  );
}
