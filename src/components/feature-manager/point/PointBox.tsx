import { IconFocusCentered, IconTrash } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { useMapStore } from "../../../stores/mapStore";
import { usePointStore } from "../../../stores/pointStores";
import type { Point } from "../../../types/geometry/point";
import { calculatePointFocus } from "../../../utils/focusHelper";
import ColorButton from "../common-ui/ColorButton";
import ColorPanel from "../common-ui/ColorPanel";
import FeatureItemBox from "../common-ui/FeatureItemBox";
import IconButton from "../common-ui/IconButton";
import PositionInput from "../common-ui/PositionInput";

type PointBoxProps = {
  point: Point;
  onUpdate: (id: string, updates: Partial<Point>) => void;
  onDelete: (id: string) => void;
};

/**
 * 緯度・経度・高度の入力欄と、削除・フォーカス・カラーの操作ボタンを持つボックス一つのセット
 */
export default function PointBox({ point, onUpdate, onDelete }: PointBoxProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const flyTo = useMapStore((state) => state.flyTo);
  const color = point.color ?? { r: 15, g: 118, b: 110, a: 255 };

  const handleFocusClick = () => {
    const latestPoint = usePointStore.getState().points.get(point.id) ?? point;
    const target = calculatePointFocus(latestPoint);
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
            onClick={() => onDelete(point.id)}
            ariaLabel="点を削除"
            variant="danger"
          >
            <IconTrash />
          </IconButton>

          <IconButton onClick={handleFocusClick} ariaLabel="点に移動">
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
      <PositionInput
        id={point.id}
        latitude={point.latitude}
        longitude={point.longitude}
        altitude={point.altitude}
        onChange={(updates) => onUpdate(point.id, updates)}
      />
      {showPicker && triggerRect && (
        <ColorPanel
          color={color}
          onChange={(newColor) => onUpdate(point.id, { color: newColor })}
          onClose={() => setShowPicker(false)}
          triggerRect={triggerRect}
          ignoreRef={buttonRef}
        />
      )}
    </FeatureItemBox>
  );
}
