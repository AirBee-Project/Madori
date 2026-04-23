import { IconChevronRight } from "@tabler/icons-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KasaneJson } from "../../data/voxel-json";
import { useClickOutside } from "../../hooks/useClickOutside";
import {
	buildInitialColorMap,
	isPrimitiveArray,
	uniqueValues,
	voxelKey,
} from "../../utils/json-color-utils";
import ColorPicker from "../color-picker/color-picker";
import styles from "./json-color-panel.module.scss";

/**
 * データの名前とそれに連なる一意な値のリストを持つエントリー型
 */
interface NameEntry {
	name: string;
	values: string[];
}

/**
 * JSONカラーパネルが受け取るプロパティ
 */
interface JsonColorPanelProps {
	content: KasaneJson;
	triggerRect: DOMRect;
	containerRight: number;
	valueColorMaps: Map<string, Map<string, [number, number, number, number]>>;
	setValueColorMaps: React.Dispatch<
		React.SetStateAction<
			Map<string, Map<string, [number, number, number, number]>>
		>
	>;
	onColorMapChange: (
		overrides: Map<string, [number, number, number, number]>,
	) => void;
	onClose: () => void;
}

/**
 * 対象の項目一覧（トップレベル）を描画するサブコンポーネント
 */
function NameListView({
	entries,
	onSelect,
}: {
	entries: NameEntry[];
	onSelect: (name: string) => void;
}) {
	return (
		<div className={styles.nameList}>
			{entries.length === 0 && (
				<div className={styles.emptyText}>対象の項目がありません</div>
			)}
			{entries.map((entry) => (
				<button
					type="button"
					key={entry.name}
					className={styles.nameItem}
					onClick={() => onSelect(entry.name)}
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
	);
}

/**
 * 色をRGBAのCSS形式へ変換するヘルパー
 */
const rgbaCss = (c: [number, number, number, number]) =>
	`rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3] / 255})`;

/**
 * カラー設定を変更するための詳細一覧（第2レベル）を描画するサブコンポーネント
 */
function ValueListView({
	selectedName,
	selectedEntry,
	currentColorMap,
	onBack,
	onSwatchClick,
}: {
	selectedName: string;
	selectedEntry: NameEntry;
	currentColorMap?: Map<string, [number, number, number, number]>;
	onBack: () => void;
	onSwatchClick: (value: string, e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
	return (
		<>
			<button
				type="button"
				className={styles.selectedHeader}
				onClick={onBack}
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
					// 色が未設定の場合はデフォルトで黒を適用
					const color =
						currentColorMap?.get(value) ??
						([0, 0, 0, 200] as [number, number, number, number]);
					return (
						<div key={value} className={styles.valueItem}>
							<span className={styles.valueText}>{value}</span>
							<button
								type="button"
								className={styles.colorSwatch}
								style={{ backgroundColor: rgbaCss(color) }}
								onClick={(e) => onSwatchClick(value, e)}
							/>
						</div>
					);
				})}
			</div>
		</>
	);
}

/**
 * JSONカラーパネルコンポーネント全体
 * 項目を選択し、さらに各値に対して色を割り当てるポップアップUI
 */
export default function JsonColorPanel({
	content,
	triggerRect,
	containerRight,
	valueColorMaps,
	setValueColorMaps,
	onColorMapChange,
	onClose,
}: JsonColorPanelProps) {
	const ref = useRef<HTMLDivElement>(null);
	const pickerOpenRef = useRef(false);

	// パネル外クリックで閉じる処理
	useClickOutside(ref, () => {
		if (!pickerOpenRef.current) {
			onClose();
		}
	});

	// JSONデータから設定可能な名前空間とその値のリストを抽出
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
	const [pickerTarget, setPickerTarget] = useState<{
		value: string;
		rect: DOMRect;
	} | null>(null);

	// 未設定の項目があれば、自動的に初期色マップを構築する
	useEffect(() => {
		let hasChanges = false;
		const newMap = new Map(valueColorMaps);

		for (const entry of nameEntries) {
			if (!newMap.has(entry.name)) {
				newMap.set(entry.name, buildInitialColorMap(entry.values));
				hasChanges = true;
			}
		}

		if (hasChanges) {
			setValueColorMaps(newMap);
		}
	}, [nameEntries, valueColorMaps, setValueColorMaps]);

	const currentColorMap = selectedName
		? valueColorMaps.get(selectedName)
		: undefined;
	const selectedEntry = nameEntries.find((e) => e.name === selectedName);

	// 色の設定が変更されたり項目が切り替わったときに、親(マップ)の描画用カラーを更新する
	useEffect(() => {
		if (!selectedName || !currentColorMap) return;

		const dataEntry = content.data.find((e) => e.name === selectedName);
		if (!dataEntry) return;

		const overrides = new Map<string, [number, number, number, number]>();
		for (const id of dataEntry.ids) {
			const valueStr = String(dataEntry.value[id.ref]);
			const color = currentColorMap.get(valueStr);
			if (color) {
				overrides.set(voxelKey(id), color);
			}
		}
		onColorMapChange(overrides);
	}, [selectedName, content, currentColorMap, onColorMapChange]);

	const handleSwatchClick = (
		value: string,
		e: React.MouseEvent<HTMLButtonElement>,
	) => {
		setPickerTarget({ value, rect: e.currentTarget.getBoundingClientRect() });
		pickerOpenRef.current = true;
	};

	const handleColorChange = (
		value: string,
		color: [number, number, number, number],
	) => {
		if (!selectedName) return;
		setValueColorMaps((prev) => {
			const next = new Map(prev);
			const nameMap = new Map(next.get(selectedName) ?? new Map());
			nameMap.set(value, color);
			next.set(selectedName, nameMap);
			return next;
		});
	};

	const panelStyle: React.CSSProperties = {
		position: "fixed",
		top: triggerRect.bottom + 4,
		right: window.innerWidth - containerRight,
		zIndex: 9999,
	};

	return (
		<div ref={ref} className={styles.panel} style={panelStyle}>
			{/* 第1階層：項目リストの描画 */}
			{!selectedName && (
				<NameListView
					entries={nameEntries}
					onSelect={(name) => {
						setSelectedName(name);
						setPickerTarget(null);
					}}
				/>
			)}

			{/* 第2階層：選択された項目の値リストの描画 */}
			{selectedName && selectedEntry && (
				<ValueListView
					selectedName={selectedName}
					selectedEntry={selectedEntry}
					currentColorMap={currentColorMap}
					onBack={() => {
						setSelectedName(null);
						setPickerTarget(null);
					}}
					onSwatchClick={handleSwatchClick}
				/>
			)}

			{/* カラーピッカーポップアップの描画 */}
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
}
