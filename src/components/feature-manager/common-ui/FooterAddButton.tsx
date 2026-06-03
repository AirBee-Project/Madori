import { IconPlus } from "@tabler/icons-react";
import styles from "./FooterAddButton.module.scss";

type FooterAddButtonProps = {
  onClick: () => void;
  ariaLabel: string;
};

/**
 * パネルのフッターの追加ボタンコンポーネント
 */
export default function FooterAddButton({
  onClick,
  ariaLabel,
}: FooterAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={styles.addButton}
      aria-label={ariaLabel}
    >
      <IconPlus size={14} /> {ariaLabel}
    </button>
  );
}
