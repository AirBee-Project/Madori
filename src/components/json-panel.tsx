import React, { useRef } from 'react';
import { IconTrash, IconTarget, IconUpload } from '@tabler/icons-react';
import styles from '../styles/json-panel.module.css';
import sharedStyles from '../styles/shared-panel.module.css';

export interface JsonItem {
    id: number;
    fileName: string;
    content: unknown;
    color: [number, number, number, number];
    voxelItemIds?: number[];
}

function rgbaCss(c: [number, number, number, number]): string {
    return `rgba(${c[0]},${c[1]},${c[2]},${c[3] / 255})`;
}

interface JsonPanelProps {
    jsonItems: JsonItem[];
    onAdd: (file: File) => void;
    onDelete: (id: number) => void;
    onFocus: (id: number) => void;
    onColorChange: (id: number) => void;
}

const JsonPanel: React.FC<JsonPanelProps> = ({
    jsonItems,
    onAdd,
    onDelete,
    onFocus,
    onColorChange,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onAdd(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={sharedStyles.panelContainer}>
            <div className={sharedStyles.scrollArea}>
                <div className={sharedStyles.itemList}>
                    {jsonItems.map((item) => (
                        <div key={item.id} className={styles.itemRow}>
                            <div className={styles.fileName}>
                                <div className={styles.fileNameBox}>
                                    <span className={styles.fileNameText}>{item.fileName}</span>
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
                                    onClick={() => onColorChange(item.id)}
                                    className={sharedStyles.colorButton}
                                >
                                    <div
                                        className={sharedStyles.colorSwatch}
                                        style={{ backgroundColor: rgbaCss(item.color) }}
                                    />
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
    );
};

export default JsonPanel;
