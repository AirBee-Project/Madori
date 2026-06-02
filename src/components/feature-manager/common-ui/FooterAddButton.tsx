import { IconPlus } from "@tabler/icons-react";
import styles from "./FooterAddButton.module.scss";

type FooterAddButtonProps = {
  onClick: () => void;
  label: string;
};

/**
 * パネルのフッターボタンコンポーネント
 */
export default function FooterAddButton({
  onClick,
  label,
}: FooterAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={styles.addButton}
      aria-label={label}
    >
      <IconPlus size={14} /> {label}
    </button>
  );
}
