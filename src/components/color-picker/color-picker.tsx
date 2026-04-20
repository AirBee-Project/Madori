import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
	AlphaPicker,
	CirclePicker,
	type ColorResult,
	type RGBColor,
} from "react-color";
import { createPortal } from "react-dom";
import { preset_colors } from "../../data/colors";
import { useClickOutside } from "../../hooks/useClickOutside";
import styles from "./color-picker.module.scss";

/**
 * カラーピッカーのプロパティ
 */
type Props = {
	color: [number, number, number, number];
	onChange: (color: [number, number, number, number]) => void;
	onClose: () => void;
	lazyUpdate?: boolean;
	triggerRect: DOMRect | null;
};

/**
 * 透明度スライダーつまみのプロパティ
 */
type AlphaPointerProps = {
	color: RGBColor;
};

/**
 * 透明度スライダーのつまみ
 * つまみの色を選択した色と同色にする
 */
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

/**
 * 透明度スライダーと％表示のプロパティ
 */
type AlphaSectionProps = {
	color: RGBColor;
	onChange: (color: ColorResult) => void;
};

/**
 * 透明度スライダーと％表示
 */
function AlphaSection({ color, onChange }: AlphaSectionProps) {
	const alphaPercentage = Math.round((color.a || 1) * 100);
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
					} as any)}
				/>
			</div>
		</div>
	);
}

/**
 * カラーパネルの位置計算
 */
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

/**
 * カラーピッカーコンポーネント
 */
export default function ColorPicker({
	color,
	onChange,
	onClose,
	lazyUpdate = false,
	triggerRect,
}: Props) {
	// rgba配列をreact-color用のオブジェクトに変換
	const [internalColor, setInternalColor] = useState<RGBColor>({
		r: color[0],
		g: color[1],
		b: color[2],
		a: color[3] / 255,
	});

	const pickerRef = useRef<HTMLDivElement>(null);
	const position = usePickerPosition(triggerRect);

	/**
	 * react-color用のオブジェクトをrgba配列に変換して親コンポーネントに渡す
	 */
	const emitColor = (rgb: RGBColor) => {
		const rgbaTuple: [number, number, number, number] = [
			rgb.r,
			rgb.g,
			rgb.b,
			Math.round((rgb.a ?? 1) * 255),
		];
		onChange(rgbaTuple);
	};

	/**
	 * 色を確定して閉じる
	 */
	const handleConfirmAndClose = () => {
		emitColor(internalColor);
		onClose();
	};

	useClickOutside(pickerRef, handleConfirmAndClose);

	/**
	 * 色変更を反映する
	 */
	const handleChange = (newColor: ColorResult) => {
		setInternalColor(newColor.rgb);

		if (!lazyUpdate) {
			emitColor(newColor.rgb);
		}
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
