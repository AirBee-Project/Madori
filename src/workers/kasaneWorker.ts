import { voxelToGeometry } from "../utils/parser/voxelToGeometry";
import { type KasaneWorkerInput, VOXEL_STRIDE } from "./kasaneWorkerProtocol";

/**
 * 空間IDから描画用ジオメトリへの重い変換計算を、メインスレッドから切り離して並列実行
 * 計算結果は Float64Array（Transferable）でゼロコピー通信することで軽量化
 */
self.onmessage = (e: MessageEvent<KasaneWorkerInput>) => {
  const { type, jobId, payload } = e.data;

  if (type === "PARSE_VOXELS") {
    const { cells, color } = payload;
    const count = cells.length;
    const buffer = new Float64Array(count * VOXEL_STRIDE);
    const voxelIds: string[] = new Array(count);

    for (let i = 0; i < count; i++) {
      const c = cells[i];
      const geom = voxelToGeometry(
        {
          z: c.z,
          fMin: c.f,
          fMax: c.f,
          xMin: c.x,
          xMax: c.x,
          yMin: c.y,
          yMax: c.y,
        },
        color,
      );

      const o = i * VOXEL_STRIDE;

      //一次元配列化
      for (let p = 0; p < 5; p++) {
        buffer[o + p * 3] = geom.points[p][0];
        buffer[o + p * 3 + 1] = geom.points[p][1];
        buffer[o + p * 3 + 2] = geom.points[p][2];
      }
      buffer[o + 15] = geom.altitude;
      buffer[o + 16] = geom.elevation;
      buffer[o + 17] = color.r;
      buffer[o + 18] = color.g;
      buffer[o + 19] = color.b;
      buffer[o + 20] = color.a;
      buffer[o + 21] = geom.startTime ?? Number.NaN;
      buffer[o + 22] = geom.endTime ?? Number.NaN;

      voxelIds[i] = geom.voxelId;
    }

    // Transferable: buffer の所有権をメインスレッドに移す（コピーゼロ）
    self.postMessage(
      {
        type: "PARSE_VOXELS_RESULT",
        jobId,
        payload: { buffer, voxelIds, count },
      },
      { transfer: [buffer.buffer] },
    );
  }
};
