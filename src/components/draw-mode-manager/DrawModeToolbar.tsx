import {
  IconMap,
  IconMountain,
  IconRefresh,
  IconTableMinus,
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
  const is3DTerrainEnabled = useMapStore((state) => state.is3DTerrainEnabled);
  const toggle3DTerrain = useMapStore((state) => state.toggle3DTerrain);

  return (
    <div className={styles.rightControls}>
      <DrawModeButton
        icon={IconRefresh}
        isActive={false}
        onClick={toggleRangeMode}
        title="Toggle range mode"
      />
      <DrawModeButton
        icon={IconMountain}
        isActive={is3DTerrainEnabled}
        onClick={toggle3DTerrain}
        title={is3DTerrainEnabled ? "Disable 3D terrain" : "Enable 3D terrain"}
      />
      <DrawModeButton
        icon={IconMap}
        isActive={false}
        title="Toggle map style"
      />
      <DrawModeButton
        icon={IconTableMinus}
        isActive={false}
        title="Clear data"
      />
    </div>
  );
}
