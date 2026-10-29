import { IconFocusCentered, IconRefresh, IconTrash } from "@tabler/icons-react";
import type React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useMapStore } from "../../../stores/mapStore";
import { getGroupFile } from "../../../stores/spatialIdGroupFiles";
import type { GraphGroup } from "../../../types/geometry/graph";
import { calculatePointsFocus } from "../../../utils/focusHelper";
import { graphGroupToGeometries } from "../../../utils/parser/graphToGeometry";
import { jsonToGraph } from "../../../utils/parser/jsonToGraph";
import ColorButton from "../common-ui/ColorButton";
import ColorPanel from "../common-ui/ColorPanel";
import FeatureItemBox from "../common-ui/FeatureItemBox";
import IconButton from "../common-ui/IconButton";
import styles from "./GraphBox.module.scss";

type GraphBoxProps = {
  group: GraphGroup;
  onUpdate: (id: string, updates: Partial<GraphGroup>) => void;
  onDelete: (id: string) => void;
};

type ColorTarget = "node" | "edge";

export default function GraphBox({ group, onUpdate, onDelete }: GraphBoxProps) {
  const nodeColorButtonRef = useRef<HTMLButtonElement>(null);
  const edgeColorButtonRef = useRef<HTMLButtonElement>(null);
  const [openColorPanel, setOpenColorPanel] = useState<ColorTarget | null>(
    null,
  );
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  const flyTo = useMapStore((state) => state.flyTo);
  const fileHandle = getGroupFile(group.id);

  const { points, edges } = useMemo(
    () => graphGroupToGeometries(group),
    [group],
  );

  const handleReloadClick = async () => {
    if (!fileHandle) {
      setFileError(
        "再読み込み元のファイルが見つかりません。再度追加してください。",
      );
      return;
    }

    setIsReloading(true);
    setFileError(null);

    try {
      const file = await fileHandle.getFile();
      const content = await file.text();
      const graph = jsonToGraph(content);
      onUpdate(group.id, { nodes: graph.nodes, adjacency: graph.adjacency });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setFileError(
        errorMessage || "グラフJSONの読み込みまたはパースに失敗しました。",
      );
    } finally {
      setIsReloading(false);
    }
  };

  const handleColorClick = (
    target: ColorTarget,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (openColorPanel === target) {
      setOpenColorPanel(null);
      setTriggerRect(null);
    } else {
      setOpenColorPanel(target);
      setTriggerRect(e.currentTarget.getBoundingClientRect());
    }
  };

  const handleColorChange = useCallback(
    (newColor: GraphGroup["nodeColor"]) => {
      if (openColorPanel === "node") {
        onUpdate(group.id, { nodeColor: newColor });
      } else if (openColorPanel === "edge") {
        onUpdate(group.id, { edgeColor: newColor });
      }
    },
    [onUpdate, group.id, openColorPanel],
  );

  const handleClosePanel = useCallback(() => {
    setOpenColorPanel(null);
    setTriggerRect(null);
  }, []);

  const handleFocusClick = () => {
    if (points.length === 0) return;
    const target = calculatePointsFocus(points);
    flyTo(target.longitude, target.latitude, target.zoom);
  };

  return (
    <>
      <FeatureItemBox
        horizontal={true}
        actions={
          <>
            <IconButton
              onClick={handleReloadClick}
              ariaLabel="グラフJSONを再読み込み"
              disabled={isReloading}
            >
              <span
                className={`${styles.iconWrapper} ${isReloading ? styles.spin : ""}`}
              >
                <IconRefresh size={20} />
              </span>
            </IconButton>
            <IconButton
              onClick={() => onDelete(group.id)}
              ariaLabel="グラフを削除"
              variant="danger"
            >
              <IconTrash />
            </IconButton>
            <IconButton onClick={handleFocusClick} ariaLabel="グラフに移動">
              <IconFocusCentered />
            </IconButton>
            <div className={styles.colorLabelGroup}>
              <span className={styles.colorLabel}>点</span>
              <ColorButton
                ref={nodeColorButtonRef}
                color={group.nodeColor}
                ariaLabel="ノードの色を変更"
                onClick={(e) => handleColorClick("node", e)}
              />
            </div>
            <div className={styles.colorLabelGroup}>
              <span className={styles.colorLabel}>線</span>
              <ColorButton
                ref={edgeColorButtonRef}
                color={group.edgeColor}
                ariaLabel="エッジの色を変更"
                onClick={(e) => handleColorClick("edge", e)}
              />
            </div>
          </>
        }
      >
        <div className={styles.fileWrapper}>
          <span className={styles.fileName}>{group.name}</span>
          <span className={styles.metaValue}>
            {points.length}ノード / {edges.length}エッジ
          </span>
          {fileError && (
            <div className={styles.errorMessage} role="alert">
              {fileError}
            </div>
          )}
        </div>
      </FeatureItemBox>

      {triggerRect && openColorPanel && (
        <ColorPanel
          color={openColorPanel === "node" ? group.nodeColor : group.edgeColor}
          onChange={handleColorChange}
          onClose={handleClosePanel}
          triggerRect={triggerRect}
          ignoreRef={
            openColorPanel === "node" ? nodeColorButtonRef : edgeColorButtonRef
          }
        />
      )}
    </>
  );
}
