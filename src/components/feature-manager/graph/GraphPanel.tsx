import type React from "react";
import { useRef, useState } from "react";
import { useGraphGroupStore } from "../../../stores/graphGroupStores";
import {
  deleteGroupFile,
  type FileHandleLike,
  fileToHandle,
  isFileSystemAccessSupported,
  pickJsonFile,
  setGroupFile,
} from "../../../stores/spatialIdGroupFiles";
import type { GraphGroup } from "../../../types/geometry/graph";
import { jsonToGraph } from "../../../utils/parser/jsonToGraph";
import FeatureItemBox from "../common-ui/FeatureItemBox";
import FooterAddButton from "../common-ui/FooterAddButton";
import CommonPanel from "../common-ui/Panel";
import GraphBox from "./GraphBox";
import styles from "./GraphBox.module.scss";

const DEFAULT_NODE_COLOR = { r: 15, g: 118, b: 110, a: 255 };
const DEFAULT_EDGE_COLOR = { r: 100, g: 116, b: 139, a: 200 };

export default function GraphPanel() {
  const graphGroupsMap = useGraphGroupStore((state) => state.graphGroups);
  const addGraphGroup = useGraphGroupStore((state) => state.addGraphGroup);
  const editGraphGroup = useGraphGroupStore((state) => state.editGraphGroup);
  const removeGraphGroup = useGraphGroupStore(
    (state) => state.removeGraphGroup,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingFiles, setLoadingFiles] = useState<
    { id: string; name: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const groupsList = Array.from(graphGroupsMap.values());

  // ハンドルからグラフJSONを読み込み、新しいグループを作成してハンドルを保持する
  const addGraphFromHandle = async (handle: FileHandleLike) => {
    const loadingId = Math.random().toString(36).substring(7);
    setLoadingFiles((prev) => [...prev, { id: loadingId, name: handle.name }]);
    setError(null);

    try {
      const file = await handle.getFile();
      const content = await file.text();
      const graph = jsonToGraph(content);

      // 追加されたグループのIDを特定するため、追加前後のキー差分を取る
      const before = new Set(useGraphGroupStore.getState().graphGroups.keys());
      const result = addGraphGroup({
        name: handle.name,
        nodeColor: DEFAULT_NODE_COLOR,
        edgeColor: DEFAULT_EDGE_COLOR,
        nodes: graph.nodes,
        adjacency: graph.adjacency,
      });
      if (!result.success) return;

      const after = useGraphGroupStore.getState().graphGroups;
      for (const key of after.keys()) {
        if (!before.has(key)) {
          setGroupFile(key, handle);
          break;
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || "グラフJSONのパースに失敗しました。");
    } finally {
      setLoadingFiles((prev) => prev.filter((item) => item.id !== loadingId));
    }
  };

  const handleAddClick = async () => {
    // 非対応ブラウザ（Firefox/Safari等）は <input type=file> にフォールバック
    if (!isFileSystemAccessSupported()) {
      fileInputRef.current?.click();
      return;
    }

    let handle: FileHandleLike | null;
    try {
      handle = await pickJsonFile();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      console.error("ファイル選択エラー:", err);
      setError("ファイルの選択中にエラーが発生しました。");
      return;
    }
    if (!handle) return;

    await addGraphFromHandle(handle);
  };

  // フォールバック（<input type=file>）からの追加
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    await addGraphFromHandle(fileToHandle(file));
  };

  const handleUpdate = (id: string, updates: Partial<GraphGroup>) => {
    editGraphGroup(id, updates);
  };

  const handleDelete = (id: string) => {
    deleteGroupFile(id);
    removeGraphGroup(id);
  };

  return (
    <CommonPanel
      footerButton={
        <FooterAddButton
          onClick={handleAddClick}
          ariaLabel="グラフJSONを追加"
        />
      }
    >
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />

      {error && (
        <div className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}

      {loadingFiles.map((loadingFile) => (
        <FeatureItemBox key={loadingFile.id} horizontal={true} actions={null}>
          <div className={styles.dataSection}>
            <span className={styles.metaValue}>
              {loadingFile.name} を読み込み中...
            </span>
          </div>
        </FeatureItemBox>
      ))}

      {groupsList.map((group) => (
        <GraphBox
          key={group.id}
          group={group}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}
    </CommonPanel>
  );
}
