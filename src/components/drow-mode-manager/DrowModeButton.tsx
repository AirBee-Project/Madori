import type { Icon, IconProps } from "@tabler/icons-react";
import styles from "./DrowModeButton.module.css";

type DrowmodeButtonProps = {

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
 * @description DrowmodeManagerの個別のボタンを作成するためのコンポーネント。
 */
export default function DrowModeButton({
  icon: Icon,
  isActive,
  onClick, 
}: DrowmodeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.circleButton} ${
        isActive ? styles.circleButtonActive : ""
      }`}
    >
      <Icon size={18}/>
    </button>
  );
}