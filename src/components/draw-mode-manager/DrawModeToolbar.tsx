import {
  IconBorderOuter,
  IconCamera,
  IconEraser,
  IconMap,
  IconPointer,
  IconRefresh,
  IconSettings,
  IconView360Number,
} from "@tabler/icons-react";
import { useState } from "react";
import { clearAllCache } from "../../api/kasane/cache";
import { useKasaneStore } from "../../stores/kasaneStore";
import { useMapStore } from "../../stores/mapStore";
import { useSpatialIdGroupStore } from "../../stores/spatialIdGroupStores";
import DrawModeButton from "./DrawModeButton";
import styles from "./DrawModeToolbar.module.scss";

type DrawModeToolbarProps = {
  /** trueの場合、通常は歯車ボタンだけを表示し、クリックで縦に展開する */
  collapsible?: boolean;
};

/**
 * @description 範囲表記と個別表記のモード切り替えや、地図の切り替え、タイムゾーンを変更するためのUI。画面右下に表示される。
 */
export default function DrawModeToolbar({
  collapsible = false,
}: DrawModeToolbarProps) {
  const toggleRangeMode = useSpatialIdGroupStore(
    (state) => state.toggleRangeMode,
  );
  const showBorder = useSpatialIdGroupStore((state) => state.showBorder);
  const toggleBorder = useSpatialIdGroupStore((state) => state.toggleBorder);
  const pickable = useSpatialIdGroupStore((state) => state.pickable);
  const togglePicking = useSpatialIdGroupStore((state) => state.togglePicking);

  const isAutoRotating = useMapStore((state) => state.isAutoRotating);
  const toggleAutoRotation = useMapStore((state) => state.toggleAutoRotation);
  const takeScreenshot = useMapStore((state) => state.takeScreenshot);

  const [expanded, setExpanded] = useState(!collapsible);

  return (
    <div className={styles.rightControls}>
      {expanded && (
        <>
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
          <DrawModeButton
            icon={IconCamera}
            isActive={false}
            onClick={() => takeScreenshot?.()}
          />
          <DrawModeButton
            icon={IconEraser}
            isActive={false}
            onClick={async () => {
              await clearAllCache();
              useKasaneStore.getState().incrementCacheRevision();
            }}
          />
        </>
      )}
      {collapsible && (
        <DrawModeButton
          icon={IconSettings}
          isActive={expanded}
          onClick={() => setExpanded((v) => !v)}
        />
      )}
    </div>
  );
}
