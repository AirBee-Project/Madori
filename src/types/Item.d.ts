import { Line } from "./Line";
import { Point } from "./Point";
import { Voxel } from "./Voxel";
import { Tiles3D } from "./Tiles3D";

type ItemType = "point" | "line" | "voxel" | "tiles3d";

type ItemDataMap = {
  point: Point;
  line: Line;
  voxel: Voxel;
  tiles3d: Tiles3D;
};

export type Item<T extends ItemType = ItemType> = {
  id: number;
  type: "point" | "line" | "voxel" | "tiles3d";
  isDeleted: boolean;
  isVisible: boolean;
  data: ItemDataMap[T];
};
