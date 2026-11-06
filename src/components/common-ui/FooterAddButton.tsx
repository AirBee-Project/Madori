import { IconPlus } from "@tabler/icons-react";
import styles from "./FooterAddButton.module.scss";

type FooterAddButtonProps = {
  onClick: () => void;
  label: string;
};

/**
 * パネルのフッターの追加ボタン
 */
export default function FooterAddButton({
  onClick,
  label,
}: FooterAddButtonProps) {
  return (
    <button type="button" onClick={onClick} className={styles.addButton}>
      <IconPlus size={14} /> {label}
    </button>
  );
}
