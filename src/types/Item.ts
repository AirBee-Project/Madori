import { Line } from "./Line";
import { Point } from "./Point";
import { Voxel } from "./Voxel";

type ItemType = "point" | "line" | "voxel";

type ItemDataMap = {
  point: Point;
  line: Line;
  voxel: Voxel;
};

export type Item<T extends ItemType = ItemType> = {
  id: number;
  type: "point" | "line" | "voxel";
  isDeleted: boolean;
  isVisible: boolean;
  isFocused: boolean;
  data: ItemDataMap[T];
};
