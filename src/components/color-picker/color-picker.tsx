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

type Props = {
	color: [number, number, number, number];
	onChange: (color: [number, number, number, number]) => void;
	onClose: () => void;
	lazyUpdate?: boolean;
	triggerRect: DOMRect | null;
};

export default function ColorPicker({
	color,
	onChange,
	onClose,
	lazyUpdate = false,
	triggerRect,
}: Props) {
	const [internalColor, setInternalColor] = useState<RGBColor>({
		r: color[0],
		g: color[1],
		b: color[2],
		a: color[3] / 255,
	});

	const pickerRef = useRef<HTMLDivElement>(null);

	const emitColor = (rgb: RGBColor) => {
		onChange([rgb.r, rgb.g, rgb.b, Math.round((rgb.a ?? 1) * 255)]);
	};

	const handleConfirmAndClose = () => {
		emitColor(internalColor);
		onClose();
	};

	useClickOutside(pickerRef, handleConfirmAndClose);

	const handleChange = (c: ColorResult) => {
		setInternalColor(c.rgb);
		if (!lazyUpdate) {
			emitColor(c.rgb);
		}
	};

	const [position, setPosition] = useState<React.CSSProperties>({});

	useEffect(() => {
		if (triggerRect) {
			let top = triggerRect.bottom + 8;

			const panel = document.querySelector('[class*="panelContainer"]');
			let left = panel ? panel.getBoundingClientRect().left : 16;

			if (left < 10) left = 10;
			if (top + 150 > window.innerHeight) {
				top = triggerRect.top - 160; // 上に出す
			}

			setPosition({ top, left });
		}
	}, [triggerRect]);

	if (!triggerRect) return null;

	return createPortal(
		<div
			ref={pickerRef}
			className={styles.pickerContainer}
			style={position}
			onClick={(e) => e.stopPropagation()}
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

			<div className={styles.alphaSection}>
				<div className={styles.alphaText}>
					<span>{Math.round((internalColor.a || 1) * 100)}%</span>
				</div>
				<div className={styles.alphaPickerWrapper}>
					<AlphaPicker
						color={internalColor}
						onChange={handleChange}
						width="100%"
						height="12px"
						styles={{
							default: {
								picker: {
									borderRadius: "4px",
									boxShadow: "none",
									border: "1px solid #e5e7eb",
								},
							},
						}}
						{...({
							pointer: () => (
								<div
									style={{
										width: "12px",
										height: "12px",
										borderRadius: "50%",
										backgroundColor: "#ffffff",
										boxShadow: `0 0 0 8px rgba(${internalColor.r}, ${internalColor.g}, ${internalColor.b}, 0.5), 0 2px 5px rgba(0,0,0,0.2)`,
										transform: "translate(-10px, 0px)",
										cursor: "pointer",
									}}
								/>
							),
						} as any)}
					/>
				</div>
			</div>
		</div>,
		document.body,
	);
}
