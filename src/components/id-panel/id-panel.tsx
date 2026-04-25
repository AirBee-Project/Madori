import { IconPlus, IconTarget, IconTrash } from "@tabler/icons-react";
import type React from "react";
import { useState } from "react";
import type { Item } from "../../data/item";
import sharedStyles from "../../styles/panel.module.scss";
import { rgbaCss } from "../../utils/color-utils";
import ColorPicker from "../color-picker/color-picker";
import styles from "./id-panel.module.scss";

/**
 * IDパネルが受け取るプロパティ
 */
interface IdsListProps {
  items: Item[];
  onAdd: () => void;
  onDelete: (id: number) => void;
  onFocus: (id: number) => void;
  onColorChange: (id: number, color: [number, number, number, number]) => void;
  onUpdate: (id: number, newVoxelString: string) => void;
}

/**
 * IDボックスの描画用プロパティ
 */
type IdBoxProps = {
  item: Item<"voxel">;
  onUpdate: (id: number, value: string) => void;
  onDelete: (id: number) => void;
  onFocus: (id: number) => void;
  onColorClick: (id: number, e: React.MouseEvent<HTMLButtonElement>) => void;
};

/**
 * IDボックス（テキストエリア＋削除ボタン＋フォーカスボタン＋カラーボタン）の描画コンポーネント
 */
function IdBox({
  item,
  onUpdate,
  onDelete,
  onFocus,
  onColorClick,
}: IdBoxProps) {
  return (
    <div className={styles.itemRow}>
      <div className={styles.textAreaWrapper}>
        <textarea
          className={styles.textArea}
          value={item.data.voxelString || ""}
          onChange={(e) => onUpdate(item.id, e.target.value)}
        />
      </div>
      <div className={styles.actionButtons}>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className={`${sharedStyles.iconButton} ${sharedStyles.deleteButton} `}
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
          className={sharedStyles.colorButton}
          title="Change Color"
        >
          <div
            className={sharedStyles.colorSwatch}
            style={{ backgroundColor: rgbaCss(item.data.color) }}
          />
        </button>
      </div>
    </div>
  );
}

/**
 * 複数のIDボックスが入るパネル全体
 */
export default function IdPanel({
  items,
  onAdd,
  onDelete,
  onFocus,
  onColorChange,
  onUpdate,
}: IdsListProps) {
  /**
   * 手動入力された時空間IDだけを抽出したリスト
   */
  const voxelItems = items.filter(
    (item): item is Item<"voxel"> =>
      item.type === "voxel" && item.source !== "json" && !item.isDeleted,
  );

  // どのIDボックスの色変更ボタンを押したかとボタンの座標を保持
  const [openPickerId, setOpenPickerId] = useState<number | null>(null);
  const [pickerRect, setPickerRect] = useState<DOMRect | null>(null);

  /**
   * 色変更ボタンがクリックされた時
   * カラーピッカーの開閉と位置設定を行う関数
   */
  const handleColorClick = (
    id: number,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (openPickerId === id) {
      setOpenPickerId(null); //カラーピッカーを閉じる
    } else {
      setPickerRect(e.currentTarget.getBoundingClientRect()); //色変更ボタンの座標を取得
      setOpenPickerId(id); //カラーピッカーを開く
    }
  };

  /**
   * カラーピッカーを閉じる関数
   */
  const handleClosePicker = () => {
    setOpenPickerId(null);
  };

  /**
   * カラーピッカーでの変更を親コンポーネントに伝える関数
   */
  const handleColorChange = (color: [number, number, number, number]) => {
    if (openPickerId !== null) {
      onColorChange(openPickerId, color);
    }
  };

  /**
   * カラーピッカーを開いているアイテムの色を取得する関数
   */
  const getActiveColor = (): [number, number, number, number] => {
    /**
     * カラーピッカーを開いているID一つ
     */
    const activeItem = items.find((i) => i.id === openPickerId) as
      | Item<"voxel">
      | undefined;
    /**
     * カラーピッカーを開いているIDの色
     */
    const activeColor = activeItem?.data?.color as
      | [number, number, number, number]
      | undefined;

    return activeColor || [0, 0, 0, 255];
  };

  return (
    <div className={sharedStyles.panelContainer}>
      <div className={sharedStyles.scrollArea}>
        <div className={sharedStyles.itemList}>
          {voxelItems.map((item) => (
            <IdBox
              key={item.id}
              item={item}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onFocus={onFocus}
              onColorClick={handleColorClick}
            />
          ))}
        </div>
      </div>
      <div className={sharedStyles.footer}>
        <button
          type="button"
          onClick={onAdd}
          className={sharedStyles.addButton}
        >
          <IconPlus /> 時空間IDを追加
        </button>
      </div>
      {openPickerId !== null && pickerRect && (
        <ColorPicker
          triggerRect={pickerRect}
          color={getActiveColor()}
          onChange={handleColorChange}
          onClose={handleClosePicker}
          lazyUpdate={false}
        />
      )}
    </div>
  );
}
