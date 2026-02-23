import type { Line } from "./line";
import type { Point } from "./point";
import type { Voxel } from "./voxel";

type ItemMap = {
	point: Point;
	line: Line;
	voxel: Voxel;
};

export type Item<T extends keyof ItemMap = keyof ItemMap> = {
	[K in T]: {
		id: number;
		type: K;
		source?: "json" | "manual";
		isDeleted: boolean;
		isVisible: boolean;
		data: ItemMap[K];
	};
}[T];
