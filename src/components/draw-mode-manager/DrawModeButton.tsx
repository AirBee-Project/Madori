import type { Icon, IconProps } from "@tabler/icons-react";
import styles from "./DrawModeButton.module.scss";

type DrawModeButtonProps = {
  /** アイコン */
  icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>;

  /** 現在アクティブかどうか。
   * アクティブな場合は色が変更される。
   */
  isActive: boolean;

  /** クリック時に呼ばれる関数 */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;

  /** ボタンのツールチップテキスト */
  title?: string;
};

/**
 * @description DrawModeManagerの個別のボタンを作成するためのコンポーネント。
 */
export default function DrawModeButton({
  icon: Icon,
  isActive,
  onClick,
  title,
}: DrawModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`${styles.circleButton} ${
        isActive ? styles.circleButtonActive : ""
      }`}
    >
      <Icon size={18} />
    </button>
  );
}
