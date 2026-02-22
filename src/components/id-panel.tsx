import React from 'react';
import { Item } from '../data/item';
import { Color } from 'deck.gl';
import { IconTrash, IconTarget, IconPlus } from '@tabler/icons-react';
import styles from '../styles/id-panel.module.css';
import sharedStyles from '../styles/panel.module.css';

function rgbaCss(c: Color): string {
    if (Array.isArray(c)) {
        const [r, g, b, a = 255] = c;
        return `rgba(${r},${g},${b},${a / 255})`;
    }
    return String(c);
}

interface IdPanelProps {
    items: Item[];
    onAdd: () => void;
    onDelete: (id: number) => void;
    onFocus: (id: number) => void;
    onColorChange: (id: number) => void;
    onUpdate: (id: number, newVoxelString: string) => void;
}

const IdPanel: React.FC<IdPanelProps> = ({
    items,
    onAdd,
    onDelete,
    onFocus,
    onColorChange,
    onUpdate,
}) => {
    const voxelItems = items.filter((item): item is Item<'voxel'> => item.type === 'voxel' && !item.isDeleted);

    return (
        <div className={sharedStyles.panelContainer}>
            <div className={sharedStyles.scrollArea}>
                <div className={sharedStyles.itemList}>
                    {voxelItems.map((item) => (
                        <div key={item.id} className={styles.itemRow}>
                            <div className={styles.textAreaWrapper}>
                                <textarea
                                    className={styles.textArea}
                                    value={item.data.voxelString || ''}
                                    onChange={(e) => onUpdate(item.id, e.target.value)}
                                />
                            </div>

                            <div className={styles.actionButtons}>
                                <button
                                    onClick={() => onDelete(item.id)}
                                    className={`${sharedStyles.iconButton} ${sharedStyles.deleteButton}`}
                                    title="Delete"
                                >
                                    <IconTrash />
                                </button>

                                <button
                                    onClick={() => onFocus(item.id)}
                                    className={sharedStyles.iconButton}
                                    title="Focus"
                                >
                                    <IconTarget />
                                </button>

                                <button
                                    onClick={() => onColorChange(item.id)}
                                    className={sharedStyles.colorButton}
                                    title="Change Color"
                                >
                                    <div
                                        className={sharedStyles.colorSwatch}
                                        style={{ backgroundColor: rgbaCss(item.data.color) }}
                                    />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={sharedStyles.footer}>
                <button
                    onClick={onAdd}
                    className={sharedStyles.addButton}
                >
                    <IconPlus /> 時空間IDを追加
                </button>
            </div>
        </div>
    );
};

export default IdPanel;
