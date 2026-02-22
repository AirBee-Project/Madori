import { Line } from "./line";
import { Point } from "./point";
import { Voxel } from "./voxel";

type ItemMap = {
  point: Point;
  line: Line;
  voxel: Voxel;
};

export type Item<T extends keyof ItemMap = keyof ItemMap> = {
  [K in T]: {
    id: number;
    type: K;
    isDeleted: boolean;
    isVisible: boolean;
    data: ItemMap[K];
  };
}[T];
