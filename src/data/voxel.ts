import { Color } from "deck.gl";
import { VoxelDefinition } from "./voxel-definition";

export type Voxel = {
  color: Color;
  opacity: number;
  voxel: VoxelDefinition[];
  voxelString?: string;
};
