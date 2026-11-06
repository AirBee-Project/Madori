import type { ReactNode } from "react";
import styles from "./FeatureItemBox.module.scss";

type FeatureItemBoxProps = {
  children?: ReactNode;
  /** 行の左に出す種類名など */
  label?: ReactNode;
  actions: ReactNode;
  /** 行の下に、行と同じ枠で表示する入力欄など */
  detail?: ReactNode;
};

/**
 * 一覧の一項目の枠。左に名前など（children）、右に操作ボタン（actions）を横に並べ、
 * 入力欄（detail）はその下に置く。どの項目でも操作ボタンが同じ位置に並ぶ
 */
export default function FeatureItemBox({
  children,
  label,
  actions,
  detail,
}: FeatureItemBoxProps) {
  return (
    <div className={styles.itemBox}>
      <div className={styles.row}>
        {label && <span className={styles.label}>{label}</span>}
        {children}
        <div className={styles.actionGroup}>{actions}</div>
      </div>
      {detail && <div className={styles.detail}>{detail}</div>}
    </div>
  );
}
