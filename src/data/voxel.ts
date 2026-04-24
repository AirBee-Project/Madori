import type { Color } from "deck.gl";
import type { IdDefinition } from "./id-definition";

export type Voxel = {
	color: Color;
	opacity: number;
	voxel: IdDefinition[];
	voxelString?: string;
	keys?: string[];
};
