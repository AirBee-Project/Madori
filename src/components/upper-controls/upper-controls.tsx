import {
  IconClock,
  IconCube,
  IconFileText,
  IconLine,
  IconMap,
  IconPoint,
  IconRefresh,
} from "@tabler/icons-react";
import { useState } from "react";
import { useJson } from "../../context/json";
import { useMap } from "../../context/map";
import { useVoxel } from "../../context/voxel";
import IdPanel from "../id-panel/id-panel";
import JsonPanel from "../json-panel/json-panel";
import styles from "./upper-controls.module.scss";

/**
 * 画面左上のボタンコンポーネント
 */
function ToolbarButton({
  icon: Icon,
  label,
  isActive = false,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.toolbarButton} ${isActive ? styles.toolbarButtonActive : ""}`}
      onClick={onClick}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

/**
 * 画面右下のボタンコンポーネント
 */
function RightControlButton({
  icon: Icon,
  onClick,
  title,
}: {
  icon: React.ElementType;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      className={styles.circleButton}
      onClick={onClick}
      title={title}
    >
      <Icon size={20} />
    </button>
  );
}

/**
 * 画面上部のUI要素
 */
export default function UpperControls() {
  // パネルの表示状態
  const [isIdPanelVisible, setIsIdPanelVisible] = useState(false);
  const [isJsonPanelVisible, setIsJsonPanelVisible] = useState(false);

  const {
    voxelItems,
    addVoxel,
    deleteVoxel,
    focusVoxel,
    updateVoxelString,
    updateVoxelColor,
  } = useVoxel();
  const { rangeMode, setRangeMode, isMapVisible, setIsMapVisible } = useMap();
  const { jsonItems, addJson, deleteJson, focusJson } = useJson();

  const toggleIdPanel = () => {
    setIsIdPanelVisible(!isIdPanelVisible);
    if (!isIdPanelVisible) setIsJsonPanelVisible(false);
  };

  const toggleJsonPanel = () => {
    setIsJsonPanelVisible(!isJsonPanelVisible);
    if (!isJsonPanelVisible) setIsIdPanelVisible(false);
  };

  return (
    <>
      <div className={styles.toolbar}>
        <ToolbarButton
          icon={IconCube}
          label="ID"
          isActive={isIdPanelVisible}
          onClick={toggleIdPanel}
        />
        <ToolbarButton
          icon={IconFileText}
          label="JSON"
          isActive={isJsonPanelVisible}
          onClick={toggleJsonPanel}
        />
        <ToolbarButton icon={IconPoint} label="点" />
        <ToolbarButton icon={IconLine} label="直線" />
      </div>

      {isIdPanelVisible && (
        <IdPanel
          items={voxelItems}
          onAdd={() => addVoxel()}
          onDelete={deleteVoxel}
          onFocus={focusVoxel}
          onUpdate={updateVoxelString}
          onColorChange={updateVoxelColor}
        />
      )}

      {isJsonPanelVisible && (
        <JsonPanel
          jsonItems={jsonItems}
          onAdd={addJson}
          onDelete={deleteJson}
          onFocus={focusJson}
        />
      )}

      <div className={styles.rightControls}>
        <RightControlButton
          icon={IconRefresh}
          onClick={() => setRangeMode(!rangeMode)}
          title="Toggle Compile Mode"
        />
        <RightControlButton icon={IconClock} />
        <RightControlButton
          icon={IconMap}
          onClick={() => setIsMapVisible(!isMapVisible)}
          title="Toggle Map"
        />
      </div>
    </>
  );
}
