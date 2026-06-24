import styles from "./IconButton.module.scss";

type IconButtonProps = {
  children: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
};

/**
 * パネルのアイコンボタンコンポーネント
 * ボックスの右側に配置する、アイコンのみの小さなボタン。削除などの操作に使う。
 */
export default function IconButton({
  children,
  ariaLabel,
  onClick,
  variant = "default",
  disabled = false,
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`${styles.iconButton} ${
        variant === "danger" ? styles.danger : ""
      } ${disabled ? styles.disabled : ""}`}
    >
      {children}
    </button>
  );
}
