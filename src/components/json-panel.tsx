import React, { useRef } from 'react';
import { IconTrash, IconTarget, IconUpload } from '@tabler/icons-react';

export interface JsonItem {
    id: number;
    fileName: string;
    content: unknown;
    color: string;
    voxelItemIds?: number[];
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
        <div className="absolute top-15 left-4 w-88 max-h-[80vh] bg-white/95 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden flex flex-col z-30 border border-gray-100">
            <div className="flex-1 overflow-y-auto space-y-1 pt-1.5">
                <div className="space-y-1 divide-y-1 divide-gray-100">
                    {jsonItems.map((item) => (
                        <div key={item.id} className="flex gap-2 px-3 py-2 items-center">
                            <div className="flex-1">
                                <div className="w-full h-10 px-3 text-sm font-sans border border-gray-300 rounded-lg bg-white flex items-center">
                                    <span className="text-gray-700 font-semibold truncate">{item.fileName}</span>
                                </div>
                            </div>

                            <div className="flex flex-row h-10 gap-1.5 items-center">
                                <button
                                    onClick={() => onDelete(item.id)}
                                    className="w-6 h-6 flex items-center justify-center hover:text-red-500 transition-colors rounded"
                                >
                                    <IconTrash size={18} />
                                </button>
                                <button
                                    onClick={() => onFocus(item.id)}
                                    className="w-6 h-6 flex items-center justify-center hover:text-[#0F766E] transition-colors rounded"
                                >
                                    <IconTarget size={18} />
                                </button>
                                <button
                                    onClick={() => onColorChange(item.id)}
                                    className="w-6 h-6 flex items-center justify-center rounded transition-transform hover:scale-105"
                                >
                                    <div
                                        className="w-4 h-4 rounded-sm border border-gray-300"
                                        style={{ backgroundColor: item.color }}
                                    />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-80 py-0.8 bg-white border border-gray-300 rounded-full text-gray-500 font-normal text-sm flex items-center justify-center gap-2 hover:text-[#0F766E] hover:border-[#0F766E] transition-colors"
                >
                    <IconUpload size={18} /> JSONを追加
                </button>
            </div>
        </div>
    );
};

export default JsonPanel;
