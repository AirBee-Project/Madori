import { IconChevronRight } from "@tabler/icons-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KasaneJson } from "../data/voxel-json";
import { preset_colors } from "../data/colors";
import styles from "../styles/json-color-panel.module.css";
import { useClickOutside } from "../hooks/useClickOutside";
import ColorPicker from "./color-picker";

function isPrimitiveArray(values: unknown[]): boolean {
	return values.every(
		(v) =>
			typeof v === "string" ||
			typeof v === "number" ||
			typeof v === "boolean",
	);
}

function uniqueValues(values: unknown[]): string[] {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const v of values) {
		const s = String(v);
		if (!seen.has(s)) {
			seen.add(s);
			result.push(s);
		}
	}
	return result;
}

function hexToRgba(hex: string, alpha: number): [number, number, number, number] {
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	return [r, g, b, alpha];
}

function buildInitialColorMap(values: string[]): Map<string, [number, number, number, number]> {
	const map = new Map<string, [number, number, number, number]>();
	for (let i = 0; i < values.length; i++) {
		map.set(values[i], hexToRgba(preset_colors[i % preset_colors.length], 200));
	}
	return map;
}

function spatialKey(id: { z: number; f?: [number] | [number, number]; x?: [number] | [number, number]; y?: [number] | [number, number] }): string {
	const z = id.z;
	const f = id.f ? (id.f.length === 2 ? `${id.f[0]}:${id.f[1]}` : `${id.f[0]}`) : "-";
	const x = id.x ? (id.x.length === 2 ? `${id.x[0]}:${id.x[1]}` : `${id.x[0]}`) : "-";
	const y = id.y ? (id.y.length === 2 ? `${id.y[0]}:${id.y[1]}` : `${id.y[0]}`) : "-";
	return `${z}/${f}/${x}/${y}`;
}

interface NameEntry {
	name: string;
	values: string[];
}

interface JsonColorPanelProps {
	content: KasaneJson;
	triggerRect: DOMRect;
	containerRight: number;
	valueColorMaps: Map<string, Map<string, [number, number, number, number]>>;
	setValueColorMaps: React.Dispatch<React.SetStateAction<Map<string, Map<string, [number, number, number, number]>>>>;
	onColorMapChange: (overrides: Map<string, [number, number, number, number]>) => void;
	onClose: () => void;
}

const JsonColorPanel: React.FC<JsonColorPanelProps> = ({
	content,
	triggerRect,
	containerRight,
	valueColorMaps,
	setValueColorMaps,
	onColorMapChange,
	onClose,
}) => {
	const ref = useRef<HTMLDivElement>(null);
	const pickerOpenRef = useRef(false);
	useClickOutside(ref, () => {
		if (!pickerOpenRef.current) {
			onClose();
		}
	});

	const nameEntries: NameEntry[] = useMemo(() => {
		return content.data
			.filter((entry) => isPrimitiveArray(entry.value))
			.map((entry) => ({
				name: entry.name,
				values: uniqueValues(entry.value),
			}));
	}, [content]);

	const [selectedName, setSelectedName] = useState<string | null>(
		nameEntries.length > 0 ? nameEntries[0].name : null,
	);

	for (const entry of nameEntries) {
		if (!valueColorMaps.has(entry.name)) {
			valueColorMaps.set(entry.name, buildInitialColorMap(entry.values));
		}
	}

	const [pickerTarget, setPickerTarget] = useState<{ value: string; rect: DOMRect } | null>(null);

	const currentColorMap = selectedName ? valueColorMaps.get(selectedName) : undefined;
	const selectedEntry = nameEntries.find((e) => e.name === selectedName);

	useEffect(() => {
		if (!selectedName || !currentColorMap) return;


		const dataEntry = content.data.find((e) => e.name === selectedName);
		if (!dataEntry) return;

		const overrides = new Map<string, [number, number, number, number]>();
		for (const id of dataEntry.ids) {
			const valueStr = String(dataEntry.value[id.ref]);
			const color = currentColorMap.get(valueStr);
			if (color) {
				overrides.set(spatialKey(id), color);
			}
		}
		onColorMapChange(overrides);
	}, [selectedName, valueColorMaps, content, currentColorMap, onColorMapChange]);

	const handleSwatchClick = (value: string, e: React.MouseEvent<HTMLButtonElement>) => {
		setPickerTarget({ value, rect: e.currentTarget.getBoundingClientRect() });
		pickerOpenRef.current = true;
	};

	const handleColorChange = (value: string, color: [number, number, number, number]) => {
		if (!selectedName) return;
		setValueColorMaps((prev) => {
			const next = new Map(prev);
			const nameMap = new Map(next.get(selectedName) ?? new Map());
			nameMap.set(value, color);
			next.set(selectedName, nameMap);
			return next;
		});
	};

	const rgbaCss = (c: [number, number, number, number]) =>
		`rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3] / 255})`;

	const panelStyle: React.CSSProperties = {
		position: "fixed",
		top: triggerRect.bottom + 4,
		right: window.innerWidth - containerRight,
		zIndex: 9999,
	};

	return (
		<div ref={ref} className={styles.panel} style={panelStyle}>
			{!selectedName && (
				<div className={styles.nameList}>
					{nameEntries.length === 0 && (
						<div className={styles.emptyText}>
							対象の項目がありません
						</div>
					)}
					{nameEntries.map((entry) => (
						<button
							type="button"
							key={entry.name}
							className={styles.nameItem}
							onClick={() => {
								setSelectedName(entry.name);
								setPickerTarget(null);
							}}
						>
							<span className={styles.nameText}>{entry.name}</span>
							<IconChevronRight
								size={18}
								stroke={2.5}
								className={styles.chevronIcon}
							/>
						</button>
					))}
				</div>
			)}

			{selectedName && selectedEntry && (
				<>
					<button
						type="button"
						className={styles.selectedHeader}
						onClick={() => {
							setSelectedName(null);
							setPickerTarget(null);
						}}
					>
						<span className={styles.nameText}>{selectedName}</span>
						<IconChevronRight
							size={18}
							stroke={2.5}
							className={styles.chevronIcon}
						/>
					</button>
					<div className={styles.valueList}>
						{selectedEntry.values.map((value) => {
							const color = currentColorMap?.get(value) ?? [0, 0, 0, 200] as [number, number, number, number];
							return (
								<div key={value} className={styles.valueItem}>
									<span className={styles.valueText}>{value}</span>
									<button
										type="button"
										className={styles.colorSwatch}
										style={{ backgroundColor: rgbaCss(color) }}
										onClick={(e) => handleSwatchClick(value, e)}
									/>
								</div>
							);
						})}
					</div>
				</>
			)}

			{pickerTarget && currentColorMap && (
				<ColorPicker
					triggerRect={pickerTarget.rect}
					color={currentColorMap.get(pickerTarget.value) ?? [0, 0, 0, 200]}
					onChange={(color) => handleColorChange(pickerTarget.value, color)}
					onClose={() => {
						setPickerTarget(null);
						pickerOpenRef.current = false;
					}}
					lazyUpdate={false}
				/>
			)}
		</div>
	);
};

export default JsonColorPanel;
