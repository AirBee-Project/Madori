import type React from "react";
import { useRef, useState } from "react";
import {
  setJsonFileHandle,
  useJsonLayerStore,
} from "../../../stores/jsonLayerStore";
import {
  deleteGroupFile,
  type FileHandleLike,
  fileToHandle,
  isFileSystemAccessSupported,
  pickJsonFile,
  pickTextFile,
  setGroupFile,
} from "../../../stores/spatialIdGroupFiles";
import { useSpatialIdGroupStore } from "../../../stores/spatialIdGroupStores";
import type { SpatialIdGroup } from "../../../types/geometry/spatioTemporalId/spatialIdGroup";
import { jsonToSpatialIds } from "../../../utils/parser/jsonToSpatialIds";
import { stringToSpatialIds } from "../../../utils/parser/stringToSpatialIds";
import FeatureItemBox from "../common-ui/FeatureItemBox";
import FooterAddButton from "../common-ui/FooterAddButton";
import CommonPanel from "../common-ui/Panel";
import { JsonBox } from "../json";
import SpatialIdBox from "./SpatialIdBox";
import styles from "./SpatialIdBox.module.scss";

export default function SpatialIdPanel() {
  const spatialIdGroupsMap = useSpatialIdGroupStore(
    (state) => state.spatialIdGroups,
  );
  const addSpatialIdGroup = useSpatialIdGroupStore(
    (state) => state.addSpatialIdGroup,
  );
  const editSpatialIdGroup = useSpatialIdGroupStore(
    (state) => state.editSpatialIdGroup,
  );
  const removeSpatialIdGroup = useSpatialIdGroupStore(
    (state) => state.removeSpatialIdGroup,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingFiles, setLoadingFiles] = useState<
    { id: string; name: string }[]
  >([]);

  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isJsonLoading, setIsJsonLoading] = useState(false);
  const {
    data: jsonData,
    opacity: jsonOpacity,
    setData: setJsonData,
    setOpacity: setJsonOpacity,
    clearData: clearJsonData,
  } = useJsonLayerStore();

  const groupsList = Array.from(spatialIdGroupsMap.values());

  const handleAdd = () => {
    addSpatialIdGroup({
      color: { r: 15, g: 118, b: 110, a: 128 },
      spatialIds: [],
    });
  };

  // ハンドルからファイルを読み込み、新しいグループを作成してハンドルを保持する
  const addGroupFromHandle = async (handle: FileHandleLike) => {
    const loadingId = Math.random().toString(36).substring(7);
    setLoadingFiles((prev) => [...prev, { id: loadingId, name: handle.name }]);

    try {
      const file = await handle.getFile();
      const content = await file.text();
      const parsed = stringToSpatialIds(content);

      // 追加されたグループのIDを特定するため、追加前後のキー差分を取る
      const before = new Set(
        useSpatialIdGroupStore.getState().spatialIdGroups.keys(),
      );
      const result = addSpatialIdGroup({
        color: { r: 15, g: 118, b: 110, a: 128 },
        spatialIds: parsed.success,
      });
      if (!result.success) return;

      const after = useSpatialIdGroupStore.getState().spatialIdGroups;
      for (const key of after.keys()) {
        if (!before.has(key)) {
          setGroupFile(key, handle);
          break;
        }
      }
    } finally {
      setLoadingFiles((prev) => prev.filter((item) => item.id !== loadingId));
    }
  };

  const handleAddTxtClick = async () => {
    // 非対応ブラウザ（Firefox/Safari等）は <input type=file> にフォールバック
    if (!isFileSystemAccessSupported()) {
      fileInputRef.current?.click();
      return;
    }

    let handle: FileHandleLike | null;
    try {
      handle = await pickTextFile();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      console.error("ファイル選択エラー:", err);
      return;
    }
    if (!handle) return;

    await addGroupFromHandle(handle);
  };

  // フォールバック（<input type=file>）からの追加
  const handleAddFromInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    await addGroupFromHandle(fileToHandle(file));
  };

  const addJsonFromHandle = async (handle: FileHandleLike) => {
    setIsJsonLoading(true);
    setJsonError(null);

    try {
      const file = await handle.getFile();
      const content = await file.text();
      setJsonData(jsonToSpatialIds(content));
      setJsonFileHandle(handle);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setJsonError(errorMessage || "JSONのパースに失敗しました。");
    } finally {
      setIsJsonLoading(false);
    }
  };

  const handleAddJsonClick = async () => {
    if (!isFileSystemAccessSupported()) {
      jsonFileInputRef.current?.click();
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
      setJsonError("ファイルの選択中にエラーが発生しました。");
      return;
    }
    if (!handle) return;

    await addJsonFromHandle(handle);
  };

  const handleAddJsonFromInput = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (jsonFileInputRef.current) jsonFileInputRef.current.value = "";
    if (!file) return;

    await addJsonFromHandle(fileToHandle(file));
  };

  const handleUpdate = (id: string, updates: Partial<SpatialIdGroup>) => {
    editSpatialIdGroup(id, updates);
  };

  const handleDelete = (id: string) => {
    deleteGroupFile(id);
    removeSpatialIdGroup(id);
  };

  return (
    <CommonPanel
      footerButton={
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <FooterAddButton onClick={handleAdd} ariaLabel="IDを追加" />
          <FooterAddButton onClick={handleAddTxtClick} ariaLabel=".txtを追加" />
          <input
            type="file"
            accept=".txt"
            ref={fileInputRef}
            onChange={handleAddFromInput}
            style={{ display: "none" }}
          />
          <FooterAddButton
            onClick={handleAddJsonClick}
            ariaLabel=".jsonを追加"
          />
          <input
            type="file"
            accept=".json"
            ref={jsonFileInputRef}
            onChange={handleAddJsonFromInput}
            style={{ display: "none" }}
          />
        </div>
      }
    >
      {loadingFiles.map((loadingFile) => (
        <FeatureItemBox key={loadingFile.id} horizontal={true} actions={null}>
          <div className={styles.fileWrapper}>
            <span className={styles.fileName}>読み込み中...</span>
          </div>
        </FeatureItemBox>
      ))}

      {groupsList.map((group) => (
        <SpatialIdBox
          key={group.id}
          group={group}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}

      {isJsonLoading && (
        <FeatureItemBox horizontal={true} actions={null}>
          <div className={styles.fileWrapper}>
            <span className={styles.fileName}>読み込み中...</span>
          </div>
        </FeatureItemBox>
      )}

      {jsonData && !isJsonLoading && (
        <JsonBox
          data={jsonData}
          opacity={jsonOpacity}
          onOpacityChange={setJsonOpacity}
          onDelete={clearJsonData}
        />
      )}

      {jsonError && (
        <div className={styles.errorMessage} role="alert">
          {jsonError}
        </div>
      )}
    </CommonPanel>
  );
}
