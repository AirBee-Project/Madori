import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";
import type { Item } from "../data/item";
import type { VoxelDefinition } from "../data/voxel-definition";
import hyperVoxelParse from "../utils/parse-spatiotemporal-id";

type RGBA = [number, number, number, number];

type VoxelContextType = {
	voxelItems: Item<"voxel">[];
	addVoxel: (data?: {
		color: RGBA;
		opacity: number;
		voxel: VoxelDefinition[];
		source?: "manual" | "json";
		keys?: string[];
	}) => number;
	deleteVoxel: (id: number) => void;
	updateVoxelString: (id: number, newVoxelString: string) => void;
	updateVoxelColor: (id: number, color: RGBA) => void;
	focusVoxel: (id: number) => void;
	focusOnVoxelDefs: (voxelDefs: VoxelDefinition[]) => void;
	addTooltips: (newTooltips: Map<string, string>) => void;
	voxelColorOverrides: globalThis.Map<string, RGBA>;
	setVoxelColorOverrides: React.Dispatch<
		React.SetStateAction<globalThis.Map<string, RGBA>>
	>;
	valueColorMaps: globalThis.Map<string, globalThis.Map<string, RGBA>>;
	setValueColorMaps: React.Dispatch<
		React.SetStateAction<globalThis.Map<string, globalThis.Map<string, RGBA>>>
	>;
	tooltipMap: globalThis.Map<string, string>;
	setTooltipMap: React.Dispatch<
		React.SetStateAction<globalThis.Map<string, string>>
	>;
};

const VoxelContext = createContext<VoxelContextType | undefined>(undefined);

type VoxelProviderProps = {
	children: ReactNode;
	onFlyTo: (lon: number, lat: number, zoom?: number, pitch?: number) => void;
	onTimeJump: (time: number) => void;
};

export const VoxelProvider = ({
	children,
	onFlyTo,
	onTimeJump,
}: VoxelProviderProps) => {
	const [voxelItems, setVoxelItems] = useState<Item<"voxel">[]>([]);
	const [nextVoxelId, setNextVoxelId] = useState(1000);

	const [voxelColorOverrides, setVoxelColorOverrides] = useState<
		globalThis.Map<string, RGBA>
	>(new globalThis.Map());
	const [valueColorMaps, setValueColorMaps] = useState<
		globalThis.Map<string, globalThis.Map<string, RGBA>>
	>(new globalThis.Map());
	const [tooltipMap, setTooltipMap] = useState<globalThis.Map<string, string>>(
		new globalThis.Map(),
	);

	const focusOnVoxelDefs = useCallback(
		(voxelDefs: VoxelDefinition[]) => {
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
		},
		[onFlyTo, onTimeJump],
	);

	const focusVoxel = useCallback(
		(id: number) => {
			const targetItem = voxelItems.find((i) => i.id === id);
			if (targetItem && targetItem.data.voxel.length > 0) {
				focusOnVoxelDefs(targetItem.data.voxel);
			}
		},
		[voxelItems, focusOnVoxelDefs],
	);

	const addTooltips = useCallback((newTooltips: Map<string, string>) => {
		setTooltipMap((prev) => {
			const merged = new globalThis.Map(prev);
			for (const [key, value] of newTooltips) {
				merged.set(key, value);
			}
			return merged;
		});
	}, []);

	const addVoxel = (data?: {
		color: RGBA;
		opacity: number;
		voxel: VoxelDefinition[];
		source?: "manual" | "json";
		keys?: string[];
	}): number => {
		const id = nextVoxelId;
		setNextVoxelId((prev) => prev + 1);
		const newItem: Item<"voxel"> = {
			id,
			type: "voxel",
			source: data?.source ?? "manual",
			isDeleted: false,
			isVisible: false,
			data: data
				? {
						color: data.color,
						opacity: data.opacity,
						voxel: data.voxel,
						keys: data.keys,
					}
				: { color: [0, 0, 255, 76], opacity: 30, voxel: [] },
		};
		setVoxelItems((prev) => [...prev, newItem]);
		return id;
	};

	const deleteVoxel = (id: number) => {
		const targetItem = voxelItems.find((i) => i.id === id);
		if (targetItem?.data.keys?.length) {
			const keysToRemove = targetItem.data.keys;

			setTooltipMap((prev) => {
				const next = new globalThis.Map(prev);
				let changed = false;
				for (const key of keysToRemove) {
					if (next.delete(key)) changed = true;
				}
				return changed ? next : prev;
			});

			setVoxelColorOverrides((prev) => {
				const next = new globalThis.Map(prev);
				let changed = false;
				for (const key of keysToRemove) {
					if (next.delete(key)) changed = true;
				}
				return changed ? next : prev;
			});
		}
		setVoxelItems((prev) => prev.filter((i) => i.id !== id));
	};

	const updateVoxelString = (id: number, newVoxelString: string) => {
		setVoxelItems((prevItems) =>
			prevItems.map((item) => {
				if (item.id === id) {
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
					} catch (_e) {
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

	const updateVoxelColor = (id: number, color: RGBA) => {
		setVoxelItems((prevItems) =>
			prevItems.map((item) => {
				if (item.id === id) {
					return { ...item, data: { ...item.data, color } };
				}
				return item;
			}),
		);
	};

	return (
		<VoxelContext.Provider
			value={{
				voxelItems,
				addVoxel,
				deleteVoxel,
				updateVoxelString,
				updateVoxelColor,
				focusVoxel,
				focusOnVoxelDefs,
				addTooltips,
				voxelColorOverrides,
				setVoxelColorOverrides,
				valueColorMaps,
				setValueColorMaps,
				tooltipMap,
				setTooltipMap,
			}}
		>
			{children}
		</VoxelContext.Provider>
	);
};

export const useVoxel = () => {
	const context = useContext(VoxelContext);
	if (!context) throw new Error("useVoxel must be used within a VoxelProvider");
	return context;
};
