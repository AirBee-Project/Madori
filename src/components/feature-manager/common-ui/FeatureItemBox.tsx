import type { ReactNode } from "react";
import styles from "./FeatureItemBox.module.scss";

type FeatureItemBoxProps = {
  children: ReactNode;
  actions: ReactNode;
};

/**
 * feature（point や line など）の一項目の外枠・レイアウトコンポーネント
 * 左側に入力欄（children）、右側に操作ボタン群（actions）を配置する
 */
export default function FeatureItemBox({
  children,
  actions,
}: FeatureItemBoxProps) {
  return (
    <div className={styles.itemBox}>
      {children}
      <div className={styles.actionGroup}>{actions}</div>
    </div>
  );
}
