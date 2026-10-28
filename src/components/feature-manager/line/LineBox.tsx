import { IconFocusCentered, IconTrash } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { useLineStore } from "../../../stores/lineStores";
import { useMapStore } from "../../../stores/mapStore";
import type { Line } from "../../../types/geometry/line";
import { calculateLineFocus } from "../../../utils/focusHelper";
import ColorButton from "../common-ui/ColorButton";
import ColorPanel from "../common-ui/ColorPanel";
import FeatureItemBox from "../common-ui/FeatureItemBox";
import IconButton from "../common-ui/IconButton";
import PositionInput from "../common-ui/PositionInput";
import styles from "./LineBox.module.scss";

type LineBoxProps = {
  line: Line;
  onUpdate: (id: string, updates: Partial<Line>) => void;
  onDelete: (id: string) => void;
};

/**
 * 始点・終点の緯度・経度・高度の入力欄と、削除・フォーカス・カラーの操作ボタンを持つボックス一つのセット
 */
export default function LineBox({ line, onUpdate, onDelete }: LineBoxProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const flyTo = useMapStore((state) => state.flyTo);
  const color = line.color ?? { r: 15, g: 118, b: 110, a: 255 };
  const dotColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;

  const handleFocusClick = () => {
    const latestLine = useLineStore.getState().lines.get(line.id) ?? line;
    const target = calculateLineFocus(latestLine);
    flyTo(target.longitude, target.latitude, target.zoom);
  };

  const handleColorClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setTriggerRect(e.currentTarget.getBoundingClientRect());
    setShowPicker((prev) => !prev);
  };

  return (
    <FeatureItemBox
      actions={
        <>
          <IconButton
            onClick={() => onDelete(line.id)}
            ariaLabel="線を削除"
            variant="danger"
          >
            <IconTrash />
          </IconButton>

          <IconButton onClick={handleFocusClick} ariaLabel="線に移動">
            <IconFocusCentered />
          </IconButton>

          <ColorButton
            ref={buttonRef}
            color={color}
            ariaLabel="色を変更"
            onClick={handleColorClick}
          />
        </>
      }
    >
      <div className={styles.lineContent}>
        <div className={styles.pointContainer}>
          <span className={styles.pointLabel}>
            <span
              className={styles.dot}
              style={{ backgroundColor: dotColor }}
            />
            始点
          </span>
          <PositionInput
            id={`${line.id}-start`}
            latitude={line.start.latitude}
            longitude={line.start.longitude}
            altitude={line.start.altitude}
            onChange={(updates) =>
              onUpdate(line.id, { start: { ...line.start, ...updates } })
            }
          />
        </div>

        {/* 始点と終点を結ぶ線 */}
        <div className={styles.connector} />

        <div className={styles.pointContainer}>
          <span className={styles.pointLabel}>
            <span
              className={styles.dot}
              style={{ backgroundColor: dotColor }}
            />
            終点
          </span>
          <PositionInput
            id={`${line.id}-end`}
            latitude={line.end.latitude}
            longitude={line.end.longitude}
            altitude={line.end.altitude}
            onChange={(updates) =>
              onUpdate(line.id, { end: { ...line.end, ...updates } })
            }
          />
        </div>
      </div>
      {showPicker && triggerRect && (
        <ColorPanel
          color={color}
          onChange={(newColor) => onUpdate(line.id, { color: newColor })}
          onClose={() => setShowPicker(false)}
          triggerRect={triggerRect}
          ignoreRef={buttonRef}
        />
      )}
    </FeatureItemBox>
  );
}
