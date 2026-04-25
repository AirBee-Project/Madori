import type { Color } from "deck.gl";

/**
 * Deck.glに渡す描画用ボクセルの型
 */
export type VoxelGeometry = {
  points: number[][];
  elevation: number;
  voxelID: string;
  color: Color;
  startTime: number | null;
  endTime: number | null;
};
