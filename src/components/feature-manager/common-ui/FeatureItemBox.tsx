import type { ReactNode } from "react";
import styles from "./FeatureItemBox.module.scss";

type FeatureItemBoxProps = {
  children: ReactNode;
  actions: ReactNode;
  horizontal?: boolean;
};

/**
 * feature（point や line など）の一項目の外枠・レイアウトコンポーネント
 * 左側に入力欄（children）、右側に操作ボタン群（actions）を配置する
 */
export default function FeatureItemBox({
  children,
  actions,
  horizontal = false,
}: FeatureItemBoxProps) {
  return (
    <div className={horizontal ? styles.itemBoxHorizontal : styles.itemBox}>
      {children}
      <div
        className={
          horizontal ? styles.actionGroupHorizontal : styles.actionGroup
        }
      >
        {actions}
      </div>
    </div>
  );
}
