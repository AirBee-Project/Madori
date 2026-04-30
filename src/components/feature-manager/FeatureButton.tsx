import type { Icon, IconProps } from "@tabler/icons-react";
import styles from "./FeatureButton.module.css";

type FeatureButtonProps = {
  /** Featureの名前
   * @example "点"
   */
  name: string;

  /** アイコン */
  icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>;

  /** 現在アクティブかどうか。
   * アクティブな場合は色が変更される。
   */
  isActive: boolean;

  /** クリック時に呼ばれる関数 */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

/**
 * @description FeatureManagerの個別のボタンを作成するためのコンポーネント。
 */
export default function FeatureButton({
  name,
  icon: Icon,
  isActive,
  onClick,
}: FeatureButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.toolbarButton} ${
        isActive ? styles.toolbarButtonActive : ""
      }`}
    >
      <Icon size={16} />
      {name}
    </button>
  );
}
