import type { RGBAColor } from "../types/geometry/color";

/**
 * Worker ⇔ メインスレッド間の通信プロトコル。
 * 両方からインポートされる共有定義。
 */

/** Float64Array 内のボクセル1個あたりの要素数 */
export const VOXEL_STRIDE = 23;
// [0-14]  points[0..4] × (lon, lat, alt)
// [15]    altitude
// [16]    elevation
// [17-20] color (r, g, b, a)
// [21]    startTime (NaN = null)
// [22]    endTime   (NaN = null)

export type KasaneWorkerInput = {
  type: "PARSE_VOXELS";
  jobId: string;
  payload: {
    cells: { z: number; f: number; x: number; y: number; color?: RGBAColor }[];
    color: RGBAColor;
  };
};

export type KasaneWorkerOutput = {
  type: "PARSE_VOXELS_RESULT";
  jobId: string;
  payload: {
    /** Transferable: ボクセル数 × VOXEL_STRIDE の Float64Array */
    buffer: Float64Array;
    /** 各ボクセルの空間ID文字列 */
    voxelIds: string[];
    /** ボクセル数 */
    count: number;
  };
};
