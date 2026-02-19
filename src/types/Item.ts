import { Line } from "./Line";
import { Point } from "./Point";
import { Voxel } from "./Voxel";

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
