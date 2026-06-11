import { IconTarget, IconTrash } from "@tabler/icons-react";
import type { Point } from "../../../types/geometry/point";
import ColorButton from "../common-ui/ColorButton";
import FeatureItemBox from "../common-ui/FeatureItemBox";
import IconButton from "../common-ui/IconButton";
import PositionInput from "../common-ui/PositionInput";
import { calculatePointFocus } from "../../../utils/focusHelper";
import { useMapStore } from "../../../stores/mapStore";
import { usePointStore } from "../../../stores/pointStores";

type PointBoxProps = {
  point: Point;
  onUpdate: (id: string, updates: Partial<Point>) => void;
  onDelete: (id: string) => void;
};

/**
 * 緯度・経度・高度の入力欄と、削除・フォーカス・カラーの操作ボタンを持つボックス一つのセット
 */
export default function PointBox({ point, onUpdate, onDelete }: PointBoxProps) {
  const flyTo = useMapStore((state) => state.flyTo);
  const color = point.color ?? { r: 15, g: 118, b: 110, a: 255 };

  const handleFocusClick = () => {
    const latestPoint = usePointStore.getState().points.get(point.id) ?? point;
    const target = calculatePointFocus(latestPoint);
    flyTo(target.longitude, target.latitude, target.zoom);
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
            <IconTarget />
          </IconButton>

          <ColorButton color={color} ariaLabel="色を変更" onClick={() => {}} />
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
    </FeatureItemBox>
  );
}
