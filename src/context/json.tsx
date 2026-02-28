import { createContext, type ReactNode, useContext, useState } from "react";
import type { JsonItem } from "../components/json-panel";
import type { Item } from "../data/item";
import type { VoxelDefinition } from "../data/voxel-definition";
import type { KasaneJson } from "../data/voxel-json";
import jsonToVoxelDefinition from "../utils/parse-voxel-json";

type RGBA = [number, number, number, number];

type JsonContextType = {
	jsonItems: JsonItem[];
	tooltipMap: globalThis.Map<string, string>;
	voxelColorOverrides: globalThis.Map<string, RGBA>;
	setVoxelColorOverrides: React.Dispatch<React.SetStateAction<globalThis.Map<string, RGBA>>>;
	valueColorMaps: globalThis.Map<string, globalThis.Map<string, RGBA>>;
	setValueColorMaps: React.Dispatch<React.SetStateAction<globalThis.Map<string, globalThis.Map<string, RGBA>>>>;
	addJson: (file: File) => Promise<void>;
	deleteJson: (id: number) => void;
	focusJson: (id: number) => void;
	updateJsonColor: (
		id: number,
		color: RGBA,
	) => void;
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
		new globalThis.Map(),
	);
	const [voxelColorOverrides, setVoxelColorOverrides] = useState<globalThis.Map<string, RGBA>>(
		new globalThis.Map(),
	);
	const [valueColorMaps, setValueColorMaps] = useState<globalThis.Map<string, globalThis.Map<string, RGBA>>>(
		new globalThis.Map(),
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
				source: "json",
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
				description: content.meta?.description,
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

	const updateJsonColor = (
		id: number,
		color: [number, number, number, number],
	) => {
		setJsonItems((prev) =>
			prev.map((item) => (item.id === id ? { ...item, color } : item)),
		);
		const target = jsonItems.find((i) => i.id === id);
		if (target && target.voxelItemIds) {
			const idsToUpdate = new Set(target.voxelItemIds);
			setItems((prevItems) =>
				prevItems.map((item) => {
					if (idsToUpdate.has(item.id)) {
						if (item.type === "point")
							return { ...item, data: { ...item.data, color } };
						if (item.type === "line")
							return { ...item, data: { ...item.data, color } };
						if (item.type === "voxel")
							return { ...item, data: { ...item.data, color } };
					}
					return item;
				}),
			);
		}
	};

	return (
		<JsonContext.Provider
			value={{
				jsonItems,
				tooltipMap,
				voxelColorOverrides,
				setVoxelColorOverrides,
				valueColorMaps,
				setValueColorMaps,
				addJson,
				deleteJson,
				focusJson,
				updateJsonColor,
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
