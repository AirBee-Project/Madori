import type { Color } from "deck.gl";
import type { VoxelDefinition } from "./voxel-definition";

export type Voxel = {
	color: Color;
	opacity: number;
	voxel: VoxelDefinition[];
	voxelString?: string;
};
