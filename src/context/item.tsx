import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Item } from "../data/item";
import { VoxelDefinition } from "../data/voxel-definition";
import hyperVoxelParse from "../utils/parse-spatiotemporal-id";

type ItemContextType = {
    items: Item[];
    setItems: React.Dispatch<React.SetStateAction<Item[]>>;
    addObject: (type: "point" | "line" | "voxel") => void;
    deleteItem: (id: number) => void;
    updateVoxel: (id: number, newVoxelString: string) => void;
    updateColor: (id: number, color: [number, number, number, number]) => void;
    focusItem: (id: number) => void;
    focusOnVoxel: (voxelDefs: VoxelDefinition[]) => void;
    nextItemId: number;
    setNextItemId: React.Dispatch<React.SetStateAction<number>>;
};

const ItemContext = createContext<ItemContextType | undefined>(undefined);

type ItemProviderProps = {
    children: ReactNode;
    onFlyTo: (lon: number, lat: number, zoom?: number, pitch?: number) => void;
    onTimeJump: (time: number) => void;
};

export const ItemProvider = ({ children, onFlyTo, onTimeJump }: ItemProviderProps) => {
    const [items, setItems] = useState<Item[]>([]);
    const [nextItemId, setNextItemId] = useState(1000);

    const focusOnVoxel = useCallback((voxelDefs: VoxelDefinition[]) => {
        if (voxelDefs.length === 0) return;

        const v = voxelDefs[0];
        const n = 2 ** v.Z;
        const lonPerTile = 360 / n;

        const xMin = typeof v.X === "number" ? v.X : v.X[0];
        const xMax = typeof v.X === "number" ? v.X : v.X[1];
        const yMin = typeof v.Y === "number" ? v.Y : v.Y[0];
        const yMax = typeof v.Y === "number" ? v.Y : v.Y[1];

        const centerLon = -180 + lonPerTile * ((xMin + xMax + 1) / 2);
        const yCenter = (yMin + yMax + 1) / 2;
        const centerLat =
            (Math.atan(Math.sinh(Math.PI - (yCenter / n) * 2 * Math.PI)) * 180) /
            Math.PI;

        onFlyTo(centerLon, centerLat);

        if (v.startTime !== null) {
            onTimeJump(v.startTime);
        }
    }, [onFlyTo, onTimeJump]);

    const focusItem = useCallback(
        (id: number) => {
            const targetItem = items.find((i) => i.id === id);
            if (
                targetItem &&
                targetItem.type === "voxel" &&
                targetItem.data.voxel.length > 0
            ) {
                focusOnVoxel(targetItem.data.voxel);
            }
        },
        [items, focusOnVoxel],
    );

    const updateVoxel = (id: number, newVoxelString: string) => {
        setItems((prevItems) =>
            prevItems.map((item) => {
                if (item.id === id && item.type === "voxel") {
                    try {
                        const newVoxelData = hyperVoxelParse(newVoxelString);
                        return {
                            ...item,
                            data: {
                                ...item.data,
                                voxelString: newVoxelString,
                                voxel: newVoxelData,
                            },
                        };
                    } catch (e) {
                        return {
                            ...item,
                            data: {
                                ...item.data,
                                voxelString: newVoxelString,
                                voxel: [],
                            },
                        };
                    }
                }
                return item;
            }),
        );
    };

    const deleteItem = (id: number) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    const updateColor = (id: number, color: [number, number, number, number]) => {
        setItems((prevItems) =>
            prevItems.map((item) => {
                if (item.id === id) {
                    if (item.type === "point") return { ...item, data: { ...item.data, color } };
                    if (item.type === "line") return { ...item, data: { ...item.data, color } };
                    if (item.type === "voxel") return { ...item, data: { ...item.data, color } };
                }
                return item;
            })
        );
    };

    function addObject(type: "point" | "line" | "voxel") {
        const id = items.length + 1;
        let newObject: Item;
        switch (type) {
            case "point":
                newObject = {
                    id, type: "point", isDeleted: false, isVisible: false,
                    data: { color: [255, 0, 0, 204], opacity: 80, size: 10, lat: 0, lon: 0 },
                };
                break;
            case "line":
                newObject = {
                    id, type: "line", isDeleted: false, isVisible: false,
                    data: { color: [0, 255, 0, 204], opacity: 80, size: 10, lat1: 0, lon1: 0, lat2: 45, lon2: 45 },
                };
                break;
            case "voxel":
                newObject = {
                    id, type: "voxel", isDeleted: false, isVisible: false,
                    data: { color: [0, 0, 255, 76], opacity: 30, voxel: [] },
                };
                break;
        }
        setItems((prev) => [...prev, newObject]);
    }

    return (
        <ItemContext.Provider
            value={{
                items,
                setItems,
                addObject,
                deleteItem,
                updateVoxel,
                updateColor,
                focusItem,
                focusOnVoxel,
                nextItemId,
                setNextItemId,
            }}
        >
            {children}
        </ItemContext.Provider>
    );
};

export const useItem = () => {
    const context = useContext(ItemContext);
    if (!context) throw new Error("useItem must be used within an ItemProvider");
    return context;
};
