import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AlphaPicker,
  CirclePicker,
  type ColorResult,
  type RGBColor,
} from "react-color";
import { createPortal } from "react-dom";
import { useClickOutside } from "../../../hooks/useClickOutside";
import type { RGBAColor } from "../../../types/geometry/color";
import styles from "./ColorPanel.module.scss";
import { preset_colors } from "./colors";

export interface ColorPanelProps {
  color: RGBAColor;
  onChange: (color: RGBAColor) => void;
  onClose: () => void;
  triggerRect: DOMRect | null;
  ignoreRef?: React.RefObject<HTMLElement | null>;
}

type AlphaPointerProps = {
  color: RGBColor;
};

function AlphaPointer({ color }: AlphaPointerProps) {
  const pointerStyle: React.CSSProperties = {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    boxShadow: `0 0 0 8px rgba(${color.r}, ${color.g}, ${color.b}, 0.5), 0 2px 5px rgba(0,0,0,0.2)`,
    transform: "translate(-10px, 0px)",
    cursor: "pointer",
  };

  return <div style={pointerStyle} />;
}

type AlphaSectionProps = {
  color: RGBColor;
  onChange: (color: ColorResult) => void;
};

function AlphaSection({ color, onChange }: AlphaSectionProps) {
  const alphaPercentage = Math.round((color.a ?? 1) * 100);
  const pickerStyles = {
    default: {
      picker: {
        borderRadius: "4px",
        boxShadow: "none",
        border: "1px solid #e5e7eb",
      },
    },
  };
  return (
    <div className={styles.alphaSection}>
      <div className={styles.alphaText}>
        <span>{alphaPercentage}%</span>
      </div>
      <div className={styles.alphaPickerWrapper}>
        <AlphaPicker
          color={color}
          onChange={onChange}
          width="100%"
          height="12px"
          styles={pickerStyles}
          {...({
            pointer: () => <AlphaPointer color={color} />,
          } as Record<string, unknown>)}
        />
      </div>
    </div>
  );
}

function usePickerPosition(triggerRect: DOMRect | null) {
  const [position, setPosition] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!triggerRect) {
      return;
    }

    let top = triggerRect.bottom + 8;
    const panel = document.querySelector('[class*="panelContainer"]');
    let left = panel ? panel.getBoundingClientRect().left : 16;

    if (left < 10) {
      left = 10;
    }
    const PICKER_HEIGHT = 150;
    if (top + PICKER_HEIGHT > window.innerHeight) {
      top = triggerRect.top - (PICKER_HEIGHT + 10);
    }

    setPosition({ top, left });
  }, [triggerRect]);

  return position;
}

export default function ColorPanel({
  color,
  onChange,
  onClose,
  triggerRect,
  ignoreRef,
}: ColorPanelProps) {
  const [internalColor, setInternalColor] = useState<RGBColor>({
    r: color.r,
    g: color.g,
    b: color.b,
    a: (color.a ?? 255) / 255,
  });

  const pickerRef = useRef<HTMLDivElement>(null);
  const position = usePickerPosition(triggerRect);

  useEffect(() => {
    setInternalColor({
      r: color.r,
      g: color.g,
      b: color.b,
      a: (color.a ?? 255) / 255,
    });
  }, [color]);

  const emitColor = (rgb: RGBColor) => {
    const rgba: RGBAColor = {
      r: rgb.r ?? 0,
      g: rgb.g ?? 0,
      b: rgb.b ?? 0,
      a: Math.round((rgb.a ?? 1) * 255),
    };
    onChange(rgba);
  };

  const handleConfirmAndClose = () => {
    emitColor(internalColor);
    onClose();
  };

  useEffect(() => {
    const handleScrollOrResize = () => {
      onClose();
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [onClose]);

  useClickOutside(pickerRef, handleConfirmAndClose, ignoreRef);

  const handleChange = (newColor: ColorResult) => {
    setInternalColor(newColor.rgb);
    emitColor(newColor.rgb);
  };

  if (!triggerRect) {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-label="Color Picker"
      ref={pickerRef}
      className={styles.pickerContainer}
      style={position}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className={styles.circlePickerWrapper}>
        <CirclePicker
          color={internalColor}
          onChange={handleChange}
          width="100%"
          circleSize={22}
          circleSpacing={11}
          colors={preset_colors}
        />
      </div>
      <AlphaSection color={internalColor} onChange={handleChange} />
    </div>,
    document.body,
  );
}
