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
        <div className="absolute top-16 left-4 w-88 max-h-[80vh] bg-white/95 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden flex flex-col z-30 border border-gray-100">

            {/* Scrollable List Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {voxelItems.map((item) => (
                    <div key={item.id} className="flex gap-3 p-1">
                        {/* Text Area */}
                        <div className="flex-1">
                            <textarea
                                className="w-full h-20 p-3 text-sm font-mono border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#0F766E] bg-white"
                                value={item.data.voxelString || ''}
                                onChange={(e) => onUpdate(item.id, e.target.value)}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-1 items-center pt-1">
                            <button
                                onClick={() => onDelete(item.id)}
                                className="p-1 text-black-500 hover:text-red-500 transition-colors"
                                title="Delete"
                            >
                                <IconTrash size={18} />
                            </button>

                            <button
                                onClick={() => onFocus(item.id)}
                                className="p-1 text-black-500 hover:text-[#0F766E] transition-colors"
                                title="Focus"
                            >
                                <IconTarget size={18} />
                            </button>

                            <button
                                onClick={() => onColorChange(item.id)}
                                className="w-3.5 h-3.5 rounded-md border border-black-300 shadow-sm transition-transform hover:scale-105"
                                style={{ backgroundColor: item.data.color }}
                                title="Change Color"
                            >
                                {/* Dummy Color Picker Trigger */}
                            </button>
                        </div>
                    </div>
                ))}


            </div>

            {/* Footer: Add Button */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <button
                    onClick={onAdd}
                    className="w-full py-2 bg-white border border-[#0F766E] rounded-full shadow-sm text-[#0F766E] font-bold flex items-center justify-center gap-2 hover:bg-[#0F766E] hover:text-white transition-colors"
                >
                    <IconPlus size={18} /> ボクセルを追加
                </button>
            </div>
        </div>
    );
};

export default IdPanel;
