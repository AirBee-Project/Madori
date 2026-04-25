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
 * JSONファイルのプロパティ
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
 * JSONボックスのプロパティ
 */
interface JsonBoxProps {
  item: JsonItem;
  onDelete: (id: number) => void;
  onFocus: (id: number) => void;
  onColorClick: (id: number, e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * JSONボックスの描画部品
 */
function JsonBox({ item, onDelete, onFocus, onColorClick }: JsonBoxProps) {
  return (
    <div className={styles.itemRow}>
      <div className={styles.fileName}>
        <div className={styles.fileNameBox}>
          <span className={styles.fileNameText} title={item.fileName}>
            {item.description || item.fileName}
          </span>
        </div>
      </div>
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
 * 複数のJSONボックスが入るパネル全体のプロパティ
 */
interface JsonPanelProps {
  jsonItems: JsonItem[];
  onAdd: (file: File) => void;
  onDelete: (id: number) => void;
  onFocus: (id: number) => void;
}

/**
 * 画面上のJSONデータを管理するパネル全体
 */
export default function JsonPanel({
  jsonItems,
  onAdd,
  onDelete,
  onFocus,
}: JsonPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { setVoxelColorOverrides, valueColorMaps, setValueColorMaps } =
    useVoxel();

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
   * カラーピッカーで開いているJSONファイルの取得
   */
  const targetJsonItem =
    openPickerId !== null ? jsonItems.find((i) => i.id === openPickerId) : null;

  return (
    <>
      <div ref={containerRef} className={sharedStyles.panelContainer}>
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
