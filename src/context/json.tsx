import { createContext, useContext, useState, type ReactNode } from "react";
import { Item } from "../data/item";
import { KasaneJson } from "../data/voxel-json";
import jsonToVoxelDefinition from "../utils/parse-voxel-json";
import { JsonItem } from "../components/json-panel";
import { VoxelDefinition } from "../data/voxel-definition";

type JsonContextType = {
    jsonItems: JsonItem[];
    tooltipMap: globalThis.Map<string, string>;
    addJson: (file: File) => Promise<void>;
    deleteJson: (id: number) => void;
    focusJson: (id: number) => void;
    colorChangeJson: (id: number) => void;
};

const JsonContext = createContext<JsonContextType | undefined>(undefined);

type JsonProviderProps = {
    children: ReactNode;
    items: Item[];
    setItems: React.Dispatch<React.SetStateAction<Item[]>>;
    nextItemId: number;
    setNextItemId: React.Dispatch<React.SetStateAction<number>>;
    focusOnVoxel: (voxelDefs: VoxelDefinition[]) => void;
};

export const JsonProvider = ({
    children,
    items,
    setItems,
    nextItemId,
    setNextItemId,
    focusOnVoxel,
}: JsonProviderProps) => {
    const [jsonItems, setJsonItems] = useState<JsonItem[]>([]);
    const [nextJsonId, setNextJsonId] = useState(1);
    const [tooltipMap, setTooltipMap] = useState<globalThis.Map<string, string>>(
        new globalThis.Map()
    );

    const addJson = async (file: File) => {
        try {
            const text = await file.text();
            const content = JSON.parse(text) as KasaneJson;
            const { voxelDefs, tooltipMap: newTooltips } =
                jsonToVoxelDefinition(content);

            const voxelItemIds: number[] = [];
            const newVoxelItems: Item[] = [];
            let currentId = nextItemId;

            const color: [number, number, number, number] = [0, 0, 255, 76];
            newVoxelItems.push({
                id: currentId,
                type: "voxel" as const,
                isDeleted: false,
                isVisible: false,
                data: {
                    color,
                    opacity: 30,
                    voxel: voxelDefs,
                },
            });
            voxelItemIds.push(currentId);
            currentId++;

            setNextItemId(currentId);
            setItems((prev) => [...prev, ...newVoxelItems]);
            setTooltipMap((prev) => {
                const merged = new globalThis.Map(prev);
                newTooltips.forEach((v, k) => merged.set(k, v));
                return merged;
            });

            const newJsonItem: JsonItem = {
                id: nextJsonId,
                fileName: file.name,
                content,
                color,
                voxelItemIds,
            };
            setJsonItems((prev) => [...prev, newJsonItem]);
            setNextJsonId((prev) => prev + 1);
        } catch (e) {
            console.error("Failed to parse JSON file:", e);
        }
    };

    const deleteJson = (id: number) => {
        const target = jsonItems.find((i) => i.id === id);
        if (target && target.voxelItemIds) {
            const idsToRemove = new Set(target.voxelItemIds);
            setItems((prev) => prev.filter((i) => !idsToRemove.has(i.id)));
        }
        setJsonItems((prev) => prev.filter((i) => i.id !== id));
    };

    const focusJson = (id: number) => {
        const target = jsonItems.find((i) => i.id === id);
        if (target && target.voxelItemIds && target.voxelItemIds.length > 0) {
            const voxelItem = items.find((i) => i.id === target.voxelItemIds![0]);
            if (
                voxelItem &&
                voxelItem.type === "voxel" &&
                voxelItem.data.voxel.length > 0
            ) {
                focusOnVoxel(voxelItem.data.voxel);
            }
        }
    };

    const colorChangeJson = (id: number) => {
        console.log("Color change requested for JSON item", id);
    };

    return (
        <JsonContext.Provider
            value={{
                jsonItems,
                tooltipMap,
                addJson,
                deleteJson,
                focusJson,
                colorChangeJson,
            }}
        >
            {children}
        </JsonContext.Provider>
    );
};

export const useJson = () => {
    const context = useContext(JsonContext);
    if (!context) throw new Error("useJson must be used within a JsonProvider");
    return context;
};
