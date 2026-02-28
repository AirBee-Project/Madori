import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import type { JsonItem } from "../components/json-panel/json-panel";
import type { KasaneJson } from "../data/voxel-json";
import jsonToVoxelDefinition from "../utils/parse-voxel-json";
import { useVoxel } from "./voxel";

type JsonContextType = {
	jsonItems: JsonItem[];
	addJson: (file: File) => Promise<void>;
	deleteJson: (id: number) => void;
	focusJson: (id: number) => void;
};

const JsonContext = createContext<JsonContextType | undefined>(undefined);

type JsonProviderProps = {
	children: ReactNode;
};

export const JsonProvider = ({ children }: JsonProviderProps) => {
	const [jsonItems, setJsonItems] = useState<JsonItem[]>([]);
	const [nextJsonId, setNextJsonId] = useState(1);
	const { voxelItems, addVoxel, deleteVoxel, focusOnVoxelDefs, addTooltips } =
		useVoxel();

	const addJson = useCallback(
		async (file: File) => {
			try {
				const text = await file.text();
				const content = JSON.parse(text) as KasaneJson;
				const { voxelDefs, tooltipMap: newTooltips } =
					jsonToVoxelDefinition(content);

				const color: [number, number, number, number] = [0, 0, 255, 76];
				const voxelId = addVoxel({
					color,
					opacity: 30,
					voxel: voxelDefs,
					source: "json",
					keys: Array.from(newTooltips.keys()),
				});

				addTooltips(newTooltips);

				const newJsonItem: JsonItem = {
					id: nextJsonId,
					fileName: file.name,
					description: content.meta?.description,
					content,
					color,
					voxelItemIds: [voxelId],
				};
				setJsonItems((prev) => [...prev, newJsonItem]);
				setNextJsonId((prev) => prev + 1);
			} catch (e) {
				console.error("Failed to parse JSON file:", e);
			}
		},
		[addVoxel, addTooltips, nextJsonId],
	);

	const deleteJson = useCallback(
		(id: number) => {
			const target = jsonItems.find((i) => i.id === id);
			if (target?.voxelItemIds) {
				for (const voxelId of target.voxelItemIds) {
					deleteVoxel(voxelId);
				}
			}
			setJsonItems((prev) => prev.filter((i) => i.id !== id));
		},
		[jsonItems, deleteVoxel],
	);

	const focusJson = useCallback(
		(id: number) => {
			const target = jsonItems.find((i) => i.id === id);
			if (target?.voxelItemIds && target.voxelItemIds.length > 0) {
				const voxelItem = voxelItems.find(
					(i) => i.id === target.voxelItemIds?.[0],
				);
				if (voxelItem && voxelItem.data.voxel.length > 0) {
					focusOnVoxelDefs(voxelItem.data.voxel);
				}
			}
		},
		[jsonItems, voxelItems, focusOnVoxelDefs],
	);

	const contextValue = useMemo(
		() => ({
			jsonItems,
			addJson,
			deleteJson,
			focusJson,
		}),
		[jsonItems, addJson, deleteJson, focusJson],
	);

	return (
		<JsonContext.Provider value={contextValue}>{children}</JsonContext.Provider>
	);
};

export const useJson = () => {
	const context = useContext(JsonContext);
	if (!context) throw new Error("useJson must be used within a JsonProvider");
	return context;
};
