import styles from "./IconButton.module.scss";

type IconButtonProps = {
  children: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
  /** 指定するとオン・オフの切り替えボタンになる */
  active?: boolean;
};

/**
 * アイコンのみの小さなボタン。ラベルはツールチップにも出す
 */
export default function IconButton({
  children,
  ariaLabel,
  onClick,
  variant = "default",
  disabled = false,
  active,
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      aria-pressed={active}
      disabled={disabled}
      className={`${styles.iconButton} ${
        variant === "danger" ? styles.danger : ""
      } ${active ? styles.active : ""} ${disabled ? styles.disabled : ""}`}
    >
      {children}
    </button>
  );
}
