import { IconRefresh, IconTarget, IconTrash } from "@tabler/icons-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import {
  getJsonFileHandle,
  type JsonLayerData,
  useJsonLayerStore,
} from "../../../stores/jsonLayerStore";

import { useMapStore } from "../../../stores/mapStore";
import { useTimeStore } from "../../../stores/timeStore";
import { calculateVoxelFocus } from "../../../utils/focusHelper";
import { jsonToGeometry } from "../../../utils/parser/jsonToGeometry";
import { jsonToSpatialIds } from "../../../utils/parser/jsonToSpatialIds";
import ColorButton from "../common-ui/ColorButton";
import ColorPanel from "../common-ui/ColorPanel";
import FeatureItemBox from "../common-ui/FeatureItemBox";
import IconButton from "../common-ui/IconButton";
import styles from "./JsonBox.module.scss";

type JsonBoxProps = {
  data: JsonLayerData;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  onDelete: () => void;
};

export default function JsonBox({
  data,
  opacity,
  onOpacityChange,
  onDelete,
}: JsonBoxProps) {
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const [fileError, setFileError] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const setData = useJsonLayerStore((state) => state.setData);

  const handleReloadClick = async () => {
    const handle = getJsonFileHandle();
    if (!handle) {
      setFileError(
        "再読み込み元のファイルが見つかりません。再度追加してください。",
      );
      return;
    }

    setIsReloading(true);
    setFileError(null);

    try {
      const file = await handle.getFile();
      const content = await file.text();

      const parsedData = jsonToSpatialIds(content);
      setData(parsedData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setFileError(
        errorMessage || "JSONファイルの読み込みまたはパースに失敗しました。",
      );
    } finally {
      setIsReloading(false);
    }
  };

  const flyTo = useMapStore((state) => state.flyTo);
  const setCurrentTime = useTimeStore((state) => state.setCurrentTime);

  const handleFocusClick = () => {
    const geometries = jsonToGeometry(data, true);
    if (geometries.length === 0) return;
    const target = calculateVoxelFocus(geometries);
    flyTo(target.longitude, target.latitude, target.zoom);
    if (target.minStartTime !== null) {
      setCurrentTime(target.minStartTime);
    }
  };

  const handleColorClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (triggerRect) {
      setTriggerRect(null);
    } else {
      setTriggerRect(e.currentTarget.getBoundingClientRect());
    }
  };

  const handleColorChange = useCallback(
    (newColor: { r: number; g: number; b: number; a: number }) => {
      onOpacityChange(newColor.a);
    },
    [onOpacityChange],
  );

  const handleClosePanel = useCallback(() => {
    setTriggerRect(null);
  }, []);

  return (
    <>
      <FeatureItemBox
        horizontal={true}
        actions={
          <>
            <IconButton
              onClick={handleReloadClick}
              ariaLabel="JSONデータを再読み込み"
              disabled={isReloading}
            >
              <span
                className={`${styles.iconWrapper} ${isReloading ? styles.spin : ""}`}
              >
                <IconRefresh size={20} />
              </span>
            </IconButton>
            <IconButton
              onClick={onDelete}
              ariaLabel="JSONデータを削除"
              variant="danger"
            >
              <IconTrash />
            </IconButton>
            <IconButton onClick={handleFocusClick} ariaLabel="JSONデータに移動">
              <IconTarget />
            </IconButton>
            <ColorButton
              ref={colorButtonRef}
              color={{ r: 100, g: 100, b: 100, a: opacity }}
              ariaLabel="透明度を変更"
              onClick={handleColorClick}
            />
          </>
        }
      >
        <div className={styles.dataSection}>
          <span className={styles.metaValue}>{data.name}</span>
          {fileError && (
            <div className={styles.errorMessage} role="alert">
              {fileError}
            </div>
          )}
        </div>
      </FeatureItemBox>

      {triggerRect && (
        <ColorPanel
          color={{ r: 100, g: 100, b: 100, a: opacity }}
          onChange={handleColorChange}
          onClose={handleClosePanel}
          triggerRect={triggerRect}
          ignoreRef={colorButtonRef}
          opacityOnly={true}
        />
      )}
    </>
  );
}
