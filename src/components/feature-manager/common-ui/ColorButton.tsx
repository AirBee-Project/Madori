import styles from "./ColorButton.module.scss";

type ColorButtonProps = {
  color: {
    r: number;
    g: number;
    b: number;
    a?: number;
  };
  ariaLabel: string;
  onClick?: () => void;
};

/**
 * 色を表示する小さなボタン。クリックすると色の変更操作ができるようになる。
 */
export default function ColorButton({
  color,
  ariaLabel,
  onClick,
}: ColorButtonProps) {
  return (
    <button
      type="button"
      className={styles.colorButton}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <div
        className={styles.colorSwatch}
        style={{
          backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${(color.a ?? 255) / 255})`,
        }}
      />
    </button>
  );
}
