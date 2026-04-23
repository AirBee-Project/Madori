import {
	IconEdit,
	IconTarget,
	IconTrash,
	IconUpload,
} from "@tabler/icons-react";
import type React from "react";
import { useRef, useState } from "react";
import { useVoxel } from "../../context/voxel";
import type { KasaneJson } from "../../data/voxel-json";
import sharedStyles from "../../styles/panel.module.scss";
import JsonColorPanel from "../json-color-panel/json-color-panel";
import styles from "./json-panel.module.scss";

/**
 * JSONリストアイテムのデータ構造
 */
export interface JsonItem {
	id: number;
	fileName: string;
	description?: string;
	content: unknown;
	color: [number, number, number, number];
	voxelItemIds?: number[];
}

/**
 * リスト内のJSONボックスを描画するためのプロパティ
 */
interface JsonBoxProps {
	item: JsonItem;
	onDelete: (id: number) => void;
	onFocus: (id: number) => void;
	onColorClick: (id: number, e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * リスト内のJSONボックス（ファイル名表示と操作ボタンのセット）を描画する部品
 */
function JsonBox({ item, onDelete, onFocus, onColorClick }: JsonBoxProps) {
	return (
		<div className={styles.itemRow}>
			{/* 左側：ファイル名表示エリア */}
			<div className={styles.fileName}>
				<div className={styles.fileNameBox}>
					<span className={styles.fileNameText} title={item.fileName}>
						{item.description || item.fileName}
					</span>
				</div>
			</div>

			{/* 右側：操作ボタン群（削除、フォーカス、色編集） */}
			<div className={styles.actionButtons}>
				<button
					type="button"
					onClick={() => onDelete(item.id)}
					className={`${sharedStyles.iconButton} ${sharedStyles.deleteButton}`}
					title="Delete"
				>
					<IconTrash />
				</button>
				<button
					type="button"
					onClick={() => onFocus(item.id)}
					className={sharedStyles.iconButton}
					title="Focus"
				>
					<IconTarget />
				</button>
				<button
					type="button"
					onClick={(e) => onColorClick(item.id, e)}
					className={sharedStyles.iconButton}
					title="Edit Color"
				>
					<IconEdit />
				</button>
			</div>
		</div>
	);
}

/**
 * JSONパネルが受け取るプロパティ
 */
interface JsonPanelProps {
	jsonItems: JsonItem[];
	onAdd: (file: File) => void;
	onDelete: (id: number) => void;
	onFocus: (id: number) => void;
}

/**
 * 画面上の「JSON」データを管理するパネル全体
 */
export default function JsonPanel({
	jsonItems,
	onAdd,
	onDelete,
	onFocus,
}: JsonPanelProps) {
	// ファイル入力用とパネル本体のレイアウト参照
	const fileInputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	
	// ボクセルデータと色塗り設定を管理するコンテキスト
	const { setVoxelColorOverrides, valueColorMaps, setValueColorMaps } = useVoxel();

	// カラーパネル用の状態管理（どのIDを開いているか、ボタン座標、コンテナ座標）
	const [openPickerId, setOpenPickerId] = useState<number | null>(null);
	const [pickerRect, setPickerRect] = useState<DOMRect | null>(null);
	const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

	/**
	 * 色編集ボタンがクリックされた時の処理（パネル開閉と表示位置の計算）
	 */
	const handleColorClick = (
		id: number,
		e: React.MouseEvent<HTMLButtonElement>,
	) => {
		if (openPickerId === id) {
			setOpenPickerId(null);
		} else {
			setPickerRect(e.currentTarget.getBoundingClientRect());
			setContainerRect(containerRef.current?.getBoundingClientRect() ?? null);
			setOpenPickerId(id);
		}
	};

	/**
	 * ファイルがアップロードされた時の処理
	 */
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			onAdd(file);
		}
	};

	/**
	 * 現在パネルで選択されている要素を取得
	 */
	const targetJsonItem = openPickerId !== null ? jsonItems.find((i) => i.id === openPickerId) : null;

	return (
		<>
			<div ref={containerRef} className={sharedStyles.panelContainer}>
				{/* 上部：JSONアイテムのリスト表示エリア */}
				<div className={sharedStyles.scrollArea}>
					<div className={sharedStyles.itemList}>
						{jsonItems.map((item) => (
							<JsonBox 
								key={item.id}
								item={item}
								onDelete={onDelete}
								onFocus={onFocus}
								onColorClick={handleColorClick}
							/>
						))}
					</div>
				</div>

				{/* 下部：アップロード用のインプットとボタン */}
				<div className={sharedStyles.footer}>
					<input
						ref={fileInputRef}
						type="file"
						accept=".json"
						className={styles.hiddenInput}
						onChange={handleFileChange}
					/>
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						className={sharedStyles.addButton}
					>
						<IconUpload /> JSONを追加
					</button>
				</div>
			</div>

			{/* ポップアップ式のJSONカラーパネル */}
			{targetJsonItem && pickerRect && containerRect && (
				<JsonColorPanel
					content={targetJsonItem.content as KasaneJson}
					triggerRect={pickerRect}
					containerRight={containerRect.right}
					valueColorMaps={valueColorMaps}
					setValueColorMaps={setValueColorMaps}
					onColorMapChange={setVoxelColorOverrides}
					onClose={() => setOpenPickerId(null)}
				/>
			)}
		</>
	);
}
