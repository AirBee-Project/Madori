import type React from "react";
import { useState } from "react";
import {
  deleteFileHandle,
  droppedFiles,
  type FileFormat,
  type FileHandleLike,
  pickFile,
} from "../../stores/fileHandles";
import { useJsonLayerStore } from "../../stores/jsonLayerStore";
import { useSpatialIdGroupStore } from "../../stores/spatialIdGroupStores";
import type { SpatialIdGroup } from "../../types/geometry/spatioTemporalId/spatialIdGroup";
import FeatureItemBox from "../common-ui/FeatureItemBox";
import FooterAddButton from "../common-ui/FooterAddButton";
import Panel, { type PanelProps } from "../common-ui/Panel";
import JsonBox from "./JsonBox";
import {
  DEFAULT_SPATIAL_ID_COLOR,
  loadSpatialIdFile,
} from "./loadSpatialIdFile";
import SpatialIdBox from "./SpatialIdBox";
import boxStyles from "./SpatialIdBox.module.scss";
import styles from "./SpatialIdPanel.module.scss";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

type SpatialIdPanelProps = Pick<
  PanelProps,
  "title" | "collapsed" | "onToggleCollapsed"
>;

/**
 * 空間IDの入力（直接入力・.txt・.json）と、空間IDの表示方法の切り替えをまとめたパネル
 */
export default function SpatialIdPanel({
  title,
  collapsed,
  onToggleCollapsed,
}: SpatialIdPanelProps) {
  const groups = useSpatialIdGroupStore((state) => state.spatialIdGroups);
  const addSpatialIdGroup = useSpatialIdGroupStore(
    (state) => state.addSpatialIdGroup,
  );
  const editSpatialIdGroup = useSpatialIdGroupStore(
    (state) => state.editSpatialIdGroup,
  );
  const removeSpatialIdGroup = useSpatialIdGroupStore(
    (state) => state.removeSpatialIdGroup,
  );
  const jsonLayers = useJsonLayerStore((state) => state.jsonLayers);

  const [loading, setLoading] = useState<{ key: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const loadFiles = (handles: FileHandleLike[]) => {
    setError(null);
    return Promise.all(
      handles.map(async (handle) => {
        const key = crypto.randomUUID();
        setLoading((prev) => [...prev, { key, name: handle.name }]);
        try {
          await loadSpatialIdFile(handle);
        } catch (err: unknown) {
          setError(
            errorMessage(err) || `${handle.name}: 読み込めませんでした。`,
          );
        } finally {
          setLoading((prev) => prev.filter((item) => item.key !== key));
        }
      }),
    );
  };

  const handleOpenFile = async (format: FileFormat) => {
    try {
      const handle = await pickFile(format);
      if (handle) await loadFiles([handle]);
    } catch (err: unknown) {
      console.error("ファイル選択エラー:", err);
      setError("ファイルの選択中にエラーが発生しました。");
    }
  };

  const handleAddText = () => {
    addSpatialIdGroup({ color: DEFAULT_SPATIAL_ID_COLOR, spatialIds: [] });
  };

  const hasFiles = (e: React.DragEvent) =>
    e.dataTransfer.types.includes("Files");

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    setDragging(false);
    if (collapsed) onToggleCollapsed?.();
    droppedFiles(e.dataTransfer).then(loadFiles);
  };

  const handleUpdate = (id: string, updates: Partial<SpatialIdGroup>) => {
    editSpatialIdGroup(id, updates);
  };

  const handleDelete = (id: string) => {
    deleteFileHandle(id);
    removeSpatialIdGroup(id);
  };

  return (
    <Panel
      className={dragging ? styles.dragging : undefined}
      title={title}
      collapsed={collapsed}
      onToggleCollapsed={onToggleCollapsed}
      footer={
        <div className={styles.addButtons}>
          <FooterAddButton onClick={handleAddText} label="直接入力" />
          <FooterAddButton onClick={() => handleOpenFile("txt")} label=".txt" />
          <FooterAddButton
            onClick={() => handleOpenFile("json")}
            label=".json"
          />
        </div>
      }
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {Array.from(groups.values(), (group) => (
        <SpatialIdBox
          key={group.id}
          group={group}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}

      {Array.from(jsonLayers.values(), (layer) => (
        <JsonBox key={layer.id} layer={layer} />
      ))}

      {loading.map((item) => (
        <FeatureItemBox key={item.key} actions={null}>
          <div className={boxStyles.fileWrapper}>
            <span className={boxStyles.fileName}>
              {item.name} を読み込み中...
            </span>
          </div>
        </FeatureItemBox>
      ))}
    </Panel>
  );
}
