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