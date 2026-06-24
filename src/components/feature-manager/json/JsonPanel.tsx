import type React from "react";
import { useRef, useState } from "react";
import {
  setJsonFileHandle,
  useJsonLayerStore,
} from "../../../stores/jsonLayerStore";
import {
  type FileHandleLike,
  fileToHandle,
  isFileSystemAccessSupported,
  pickJsonFile,
} from "../../../stores/spatialIdGroupFiles";
import { jsonToSpatialIds } from "../../../utils/parser/jsonToSpatialIds";
import FeatureItemBox from "../common-ui/FeatureItemBox";
import FooterAddButton from "../common-ui/FooterAddButton";
import CommonPanel from "../common-ui/Panel";
import JsonBox from "./JsonBox";
import styles from "./JsonBox.module.scss";

export default function JsonPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  const { data, opacity, setData, setOpacity, clearData } = useJsonLayerStore();

  const addJsonFromHandle = async (handle: FileHandleLike) => {
    setIsInitialLoading(true);
    setError(null);

    try {
      const file = await handle.getFile();
      const content = await file.text();
      const parsedData = jsonToSpatialIds(content);
      setData(parsedData);
      setJsonFileHandle(handle);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || "JSONのパースに失敗しました。");
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addJsonFromHandle(fileToHandle(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddClick = async () => {
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

    await addJsonFromHandle(handle);
  };

  return (
    <CommonPanel
      footerButton={
        <FooterAddButton onClick={handleAddClick} ariaLabel="JSONを追加" />
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
        <div
          style={{
            color: "#dc2626",
            fontSize: "12px",
            marginTop: "8px",
            padding: "0 16px",
          }}
        >
          {error}
        </div>
      )}

      {isInitialLoading && (
        <FeatureItemBox horizontal={true} actions={null}>
          <div className={styles.dataSection}>
            <span className={styles.metaValue}>読み込み中...</span>
          </div>
        </FeatureItemBox>
      )}

      {data && !isInitialLoading && (
        <JsonBox
          data={data}
          opacity={opacity}
          onOpacityChange={setOpacity}
          onDelete={clearData}
        />
      )}
    </CommonPanel>
  );
}
