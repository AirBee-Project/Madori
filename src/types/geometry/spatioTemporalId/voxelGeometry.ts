import type { RGBAColor } from "../color";

export interface VoxelGeometry {
  points: [number, number, number][];
  altitude: number;
  elevation: number;
  voxelId: string;
  color: RGBAColor;
  startTime: number | null;
  endTime: number | null;
  value?: number;
}
