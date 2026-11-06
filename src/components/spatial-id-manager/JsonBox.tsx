import { IconFocusCentered, IconRefresh, IconTrash } from "@tabler/icons-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { deleteFileHandle, getFileHandle } from "../../stores/fileHandles";
import { type JsonLayer, useJsonLayerStore } from "../../stores/jsonLayerStore";
import { useMapStore } from "../../stores/mapStore";
import { useTimeStore } from "../../stores/timeStore";
import type { RGBAColor } from "../../types/geometry/color";
import { calculateVoxelFocus } from "../../utils/focusHelper";
import { jsonToGeometry } from "../../utils/parser/jsonToGeometry";
import { jsonToSpatialIds } from "../../utils/parser/jsonToSpatialIds";
import ColorButton from "../common-ui/ColorButton";
import ColorPanel from "../common-ui/ColorPanel";
import FeatureItemBox from "../common-ui/FeatureItemBox";
import IconButton from "../common-ui/IconButton";
import styles from "./SpatialIdBox.module.scss";

type JsonBoxProps = {
  layer: JsonLayer;
};

export default function JsonBox({ layer }: JsonBoxProps) {
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  const editJsonLayer = useJsonLayerStore((state) => state.editJsonLayer);
  const removeJsonLayer = useJsonLayerStore((state) => state.removeJsonLayer);
  const flyTo = useMapStore((state) => state.flyTo);
  const setCurrentTime = useTimeStore((state) => state.setCurrentTime);

  // 埋め込みで渡された JSON にはファイルがない
  const fileHandle = getFileHandle(layer.id);
  const swatch: RGBAColor = { r: 100, g: 100, b: 100, a: layer.opacity };

  const handleReloadClick = async () => {
    if (!fileHandle) return;
    setIsReloading(true);
    setFileError(null);
    try {
      const content = await (await fileHandle.getFile()).text();
      editJsonLayer(layer.id, { data: jsonToSpatialIds(content) });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setFileError(
        errorMessage || "JSONファイルの読み込みまたはパースに失敗しました。",
      );
    } finally {
      setIsReloading(false);
    }
  };

  const handleDelete = () => {
    deleteFileHandle(layer.id);
    removeJsonLayer(layer.id);
  };

  const handleFocusClick = () => {
    const geometries = jsonToGeometry(layer.data, true);
    if (geometries.length === 0) return;
    const target = calculateVoxelFocus(geometries);
    flyTo(target.longitude, target.latitude, target.zoom);
    if (target.minStartTime !== null) {
      setCurrentTime(target.minStartTime);
    }
  };

  const handleColorClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setTriggerRect((prev) =>
      prev ? null : e.currentTarget.getBoundingClientRect(),
    );
  };

  const handleColorChange = useCallback(
    (newColor: RGBAColor) => {
      editJsonLayer(layer.id, { opacity: newColor.a });
    },
    [editJsonLayer, layer.id],
  );

  const handleClosePanel = useCallback(() => {
    setTriggerRect(null);
  }, []);

  return (
    <FeatureItemBox
      actions={
        <>
          {fileHandle && (
            <IconButton
              onClick={handleReloadClick}
              ariaLabel="JSONファイルを再読み込み"
              disabled={isReloading}
            >
              <span
                className={`${styles.iconWrapper} ${isReloading ? styles.spin : ""}`}
              >
                <IconRefresh size={20} />
              </span>
            </IconButton>
          )}
          <IconButton
            onClick={handleDelete}
            ariaLabel="JSONデータを削除"
            variant="danger"
          >
            <IconTrash />
          </IconButton>
          <IconButton onClick={handleFocusClick} ariaLabel="JSONデータに移動">
            <IconFocusCentered />
          </IconButton>
          <ColorButton
            ref={colorButtonRef}
            color={swatch}
            ariaLabel="透明度を変更"
            onClick={handleColorClick}
          />
        </>
      }
    >
      <div className={styles.fileWrapper}>
        <span className={styles.fileName} title={layer.data.name}>
          {fileHandle?.name ?? layer.data.name}
        </span>
        {fileError && (
          <div className={styles.errorMessage} role="alert">
            {fileError}
          </div>
        )}
      </div>
      {triggerRect && (
        <ColorPanel
          color={swatch}
          onChange={handleColorChange}
          onClose={handleClosePanel}
          triggerRect={triggerRect}
          ignoreRef={colorButtonRef}
          opacityOnly={true}
        />
      )}
    </FeatureItemBox>
  );
}
