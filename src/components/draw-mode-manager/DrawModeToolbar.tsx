import {
  IconBorderOuter,
  IconMap,
  IconPointer,
  IconRefresh,
  IconView360Number,
} from "@tabler/icons-react";
import { useMapStore } from "../../stores/mapStore";
import { useSpatialIdGroupStore } from "../../stores/spatialIdGroupStores";
import DrawModeButton from "./DrawModeButton";
import styles from "./DrawModeToolbar.module.scss";

/**
 * @description 範囲表記と個別表記のモード切り替えや、地図の切り替え、タイムゾーンを変更するためのUI。画面右下に表示される。
 */
export default function DrawModeToolbar() {
  const toggleRangeMode = useSpatialIdGroupStore(
    (state) => state.toggleRangeMode,
  );
  const showBorder = useSpatialIdGroupStore((state) => state.showBorder);
  const toggleBorder = useSpatialIdGroupStore((state) => state.toggleBorder);
  const pickable = useSpatialIdGroupStore((state) => state.pickable);
  const togglePicking = useSpatialIdGroupStore((state) => state.togglePicking);

  const isAutoRotating = useMapStore((state) => state.isAutoRotating);
  const toggleAutoRotation = useMapStore((state) => state.toggleAutoRotation);

  return (
    <div className={styles.rightControls}>
      <DrawModeButton
        icon={IconRefresh}
        isActive={false}
        onClick={toggleRangeMode}
      />
      <DrawModeButton
        icon={IconBorderOuter}
        isActive={showBorder}
        onClick={toggleBorder}
      />
      <DrawModeButton
        icon={IconPointer}
        isActive={pickable}
        onClick={togglePicking}
      />
      <DrawModeButton icon={IconMap} isActive={false} />
      <DrawModeButton
        icon={IconView360Number}
        isActive={isAutoRotating}
        onClick={toggleAutoRotation}
      />
    </div>
  );
}
