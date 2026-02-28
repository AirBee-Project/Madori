import { IconEdit, IconTarget, IconTrash, IconUpload } from "@tabler/icons-react";
import type React from "react";
import { useRef, useState } from "react";
import type { KasaneJson } from "../../data/voxel-json";
import styles from "./json-panel.module.scss";
import sharedStyles from "../../styles/panel.module.scss";
import JsonColorPanel from "../json-color-panel/json-color-panel";
import { useVoxel } from "../../context/voxel";

export interface JsonItem {
    id: number;
    fileName: string;
    description?: string;
    content: unknown;
    color: [number, number, number, number];
    voxelItemIds?: number[];
}

interface JsonPanelProps {
    jsonItems: JsonItem[];
    onAdd: (file: File) => void;
    onDelete: (id: number) => void;
    onFocus: (id: number) => void;
}

const JsonPanel: React.FC<JsonPanelProps> = ({
    jsonItems,
    onAdd,
    onDelete,
    onFocus,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { setVoxelColorOverrides, valueColorMaps, setValueColorMaps } = useVoxel();

    const [openPickerId, setOpenPickerId] = useState<number | null>(null);
    const [pickerRect, setPickerRect] = useState<DOMRect | null>(null);
    const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

    const handleColorClick = (
        id: number,
        e: React.MouseEvent<HTMLButtonElement>,
    ) => {
        if (openPickerId === id) {
            setOpenPickerId(null);
        } else {
            setPickerRect(e.currentTarget.getBoundingClientRect());
            setContainerRect(containerRef.current?.getBoundingClientRect() ?? null);
            setOpenPickerId(id);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onAdd(file);
        }
    };

    return (
        <>
            <div ref={containerRef} className={sharedStyles.panelContainer}>
                <div className={sharedStyles.scrollArea}>
                    <div className={sharedStyles.itemList}>
                        {jsonItems.map((item) => (
                            <div key={item.id} className={styles.itemRow}>
                                <div className={styles.fileName}>
                                    <div className={styles.fileNameBox}>
                                        <span className={styles.fileNameText} title={item.fileName}>
                                            {item.description || item.fileName}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.actionButtons}>
                                    <button
                                        onClick={() => onDelete(item.id)}
                                        className={`${sharedStyles.iconButton} ${sharedStyles.deleteButton}`}
                                    >
                                        <IconTrash />
                                    </button>
                                    <button
                                        onClick={() => onFocus(item.id)}
                                        className={sharedStyles.iconButton}
                                    >
                                        <IconTarget />
                                    </button>
                                    <button
                                        onClick={(e) => handleColorClick(item.id, e)}
                                        className={sharedStyles.iconButton}
                                    >
                                        <IconEdit />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={sharedStyles.footer}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        className={styles.hiddenInput}
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={sharedStyles.addButton}
                    >
                        <IconUpload /> JSONを追加
                    </button>
                </div>
            </div>

            {openPickerId !== null && pickerRect && containerRect && (() => {
                const target = jsonItems.find((i) => i.id === openPickerId);
                if (!target) return null;
                return (
                    <JsonColorPanel
                        content={target.content as KasaneJson}
                        triggerRect={pickerRect}
                        containerRight={containerRect.right}
                        valueColorMaps={valueColorMaps}
                        setValueColorMaps={setValueColorMaps}
                        onColorMapChange={setVoxelColorOverrides}
                        onClose={() => setOpenPickerId(null)}
                    />
                );
            })()}
        </>
    );
};

export default JsonPanel;

