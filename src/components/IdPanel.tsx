import React from 'react';
import { Item } from '../types/Item';
import { IconTrash, IconTarget, IconPlus } from '@tabler/icons-react';

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
    // Filter only voxel items
    const voxelItems = items.filter((item): item is Item<'voxel'> => item.type === 'voxel' && !item.isDeleted);

    return (
        <div className="absolute top-15 left-4 w-88 max-h-[80vh] bg-white/95 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden flex flex-col z-30 border border-gray-100">

            {/* Scrollable List Area */}
            <div className="flex-1 overflow-y-auto space-y-1 pt-1.5">
                <div className="space-y-1 divide-y-1 divide-gray-100">
                    {voxelItems.map((item) => (
                        <div key={item.id} className="flex gap-3 px-3 py-2">
                            {/* Text Area */}
                            <div className="flex-1">
                                <textarea
                                    className="w-full h-20 p-3 text-sm font-mono border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-[#0F766E] bg-white"
                                    value={item.data.voxelString || ''}
                                    onChange={(e) => onUpdate(item.id, e.target.value)}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col h-20 justify-between items-center">
                                <button
                                    onClick={() => onDelete(item.id)}
                                    className="w-6 h-6 flex items-center justify-center text-black-500 hover:text-red-500 transition-colors rounded"
                                    title="Delete"
                                >
                                    <IconTrash size={18} />
                                </button>

                                <button
                                    onClick={() => onFocus(item.id)}
                                    className="w-6 h-6 flex items-center justify-center text-black-500 hover:text-[#0F766E] transition-colors rounded"
                                    title="Focus"
                                >
                                    <IconTarget size={18} />
                                </button>

                                <button
                                    onClick={() => onColorChange(item.id)}
                                    className="w-6 h-6 flex items-center justify-center rounded transition-transform hover:scale-105"
                                    title="Change Color"
                                >
                                    <div
                                        className="w-4 h-4 rounded-sm border border-black-300"
                                        style={{ backgroundColor: item.data.color }}
                                    />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer: Add Button */}
            <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                <button
                    onClick={onAdd}
                    className="w-80 py-0.8 bg-white border border-gray-300 rounded-full text-gray-500 font-normal text-sm flex items-center justify-center gap-2 hover:text-[#0F766E] hover:border-[#0F766E] transition-colors"
                >
                    <IconPlus size={18} /> 時空間IDを追加
                </button>
            </div>
        </div>
    );
};

export default IdPanel;
