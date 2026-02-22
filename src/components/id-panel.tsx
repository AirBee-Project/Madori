import React from 'react';
import { Item } from '../data/item';
import { Color } from 'deck.gl';
import { IconTrash, IconTarget, IconPlus } from '@tabler/icons-react';
import styles from '../styles/id-panel.module.css';

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
        <div className={styles.panelContainer}>
            <div className={styles.scrollArea}>
                <div className={styles.itemList}>
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
                                    className={`${styles.iconButton} ${styles.deleteButton}`}
                                    title="Delete"
                                >
                                    <IconTrash size={18} />
                                </button>

                                <button
                                    onClick={() => onFocus(item.id)}
                                    className={styles.iconButton}
                                    title="Focus"
                                >
                                    <IconTarget size={18} />
                                </button>

                                <button
                                    onClick={() => onColorChange(item.id)}
                                    className={styles.colorButton}
                                    title="Change Color"
                                >
                                    <div
                                        className={styles.colorSwatch}
                                        style={{ backgroundColor: rgbaCss(item.data.color) }}
                                    />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.footer}>
                <button
                    onClick={onAdd}
                    className={styles.addButton}
                >
                    <IconPlus size={18} /> 時空間IDを追加
                </button>
            </div>
        </div>
    );
};

export default IdPanel;
