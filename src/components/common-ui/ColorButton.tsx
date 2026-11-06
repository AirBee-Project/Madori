import React from "react";
import styles from "./ColorButton.module.scss";

type ColorButtonProps = {
  color: {
    r: number;
    g: number;
    b: number;
    a?: number;
  };
  ariaLabel: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

/**
 * 色を表示する小さなボタン。クリックすると色の変更操作ができるようになる。
 */
const ColorButton = React.forwardRef<HTMLButtonElement, ColorButtonProps>(
  ({ color, ariaLabel, onClick }, ref) => {
    return (
      <button
        ref={ref}
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
  },
);

ColorButton.displayName = "ColorButton";

export default ColorButton;
