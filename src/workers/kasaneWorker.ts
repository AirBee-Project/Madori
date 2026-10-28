import { RangeId } from "@airbee-project/kasane-client";
import type { RGBAColor } from "../types/geometry/color";
import { voxelToGeometry } from "../utils/parser/voxelToGeometry";
import { type KasaneWorkerInput, VOXEL_STRIDE } from "./kasaneWorkerProtocol";

/**
 * 空間IDから描画用ジオメトリへの重い変換計算を、メインスレッドから切り離して並列実行
 * 計算結果は Float64Array（Transferable）でゼロコピー通信することで軽量化
 */

type WorkerSpatialId = {
  z: number;
  f?: number | [number, number];
  x: number | [number, number];
  y: number | [number, number];
};

function writeGeometryToBuffers(
  positions: Float64Array,
  polygonIndices: Uint32Array,
  elevations: Float32Array,
  colorsArray: Uint8Array,
  i: number,
  geom: ReturnType<typeof voxelToGeometry>,
  cellColor: RGBAColor,
) {
  polygonIndices[i] = i * 5;

  const posOffset = i * 5 * 3;
  for (let p = 0; p < 5; p++) {
    positions[posOffset + p * 3] = geom.points[p][0];
    positions[posOffset + p * 3 + 1] = geom.points[p][1];
    positions[posOffset + p * 3 + 2] = geom.points[p][2];
  }

  elevations[i] = geom.elevation;

  const colorOffset = i * 4;
  colorsArray[colorOffset] = cellColor.r;
  colorsArray[colorOffset + 1] = cellColor.g;
  colorsArray[colorOffset + 2] = cellColor.b;
  colorsArray[colorOffset + 3] = cellColor.a;
}

function parseRangeValue(
  val: number | [number, number] | undefined,
  defaultValue = 0,
): [number, number] {
  if (val === undefined) return [defaultValue, defaultValue];
  if (Array.isArray(val)) {
    return [val[0], val.length > 1 ? val[1] : val[0]];
  }
  return [val, val];
}

function processSpatialId(
  sid: WorkerSpatialId,
  cellColor: RGBAColor,
  positions: Float64Array,
  polygonIndices: Uint32Array,
  elevations: Float32Array,
  colorsArray: Uint8Array,
  voxelIds: string[],
  i: number,
) {
  const geom = voxelToGeometry(
    RangeId.createUnchecked(
      sid.z,
      parseRangeValue(sid.f, 0),
      parseRangeValue(sid.x, 0),
      parseRangeValue(sid.y, 0),
    ),
    cellColor,
  );

  writeGeometryToBuffers(
    positions,
    polygonIndices,
    elevations,
    colorsArray,
    i,
    geom,
    cellColor,
  );
  voxelIds[i] = geom.voxelId;
}

function writeFinalBuffer(
  totalCount: number,
  positions: Float64Array,
  elevations: Float32Array,
  colorsArray: Uint8Array,
): Float64Array {
  const buffer = new Float64Array(totalCount * VOXEL_STRIDE);
  for (let idx = 0; idx < totalCount; idx++) {
    const posOffset = idx * 5 * 3;
    const colorOffset = idx * 4;
    const o = idx * VOXEL_STRIDE;
    for (let p = 0; p < 5; p++) {
      buffer[o + p * 3] = positions[posOffset + p * 3];
      buffer[o + p * 3 + 1] = positions[posOffset + p * 3 + 1];
      buffer[o + p * 3 + 2] = positions[posOffset + p * 3 + 2];
    }
    const geomAlt = positions[posOffset + 2];
    buffer[o + 15] = geomAlt;
    buffer[o + 16] = elevations[idx];
    buffer[o + 17] = colorsArray[colorOffset];
    buffer[o + 18] = colorsArray[colorOffset + 1];
    buffer[o + 19] = colorsArray[colorOffset + 2];
    buffer[o + 20] = colorsArray[colorOffset + 3];
    buffer[o + 21] = Number.NaN;
    buffer[o + 22] = Number.NaN;
  }
  return buffer;
}

function processWorkerPayload(payload: KasaneWorkerInput["payload"]) {
  const { data, colors, dictionary, defaultColor } = payload;
  let totalCount = 0;
  for (const group of data) {
    for (const _rawSid of group.spatialIds) {
      totalCount++;
    }
  }

  const positions = new Float64Array(totalCount * 5 * 3);
  const polygonIndices = new Uint32Array(totalCount + 1);
  const elevations = new Float32Array(totalCount);
  const colorsArray = new Uint8Array(totalCount * 4);
  const voxelIds: string[] = new Array(totalCount);
  const valueRefs = new Uint32Array(totalCount);
  let i = 0;

  for (const group of data) {
    const cellColor = colors[group.valueRef] ?? defaultColor;

    for (const rawSid of group.spatialIds) {
      processSpatialId(
        rawSid as WorkerSpatialId,
        cellColor,
        positions,
        polygonIndices,
        elevations,
        colorsArray,
        voxelIds,
        i,
      );
      valueRefs[i] = group.valueRef;
      i++;
    }
  }

  const buffer = writeFinalBuffer(
    totalCount,
    positions,
    elevations,
    colorsArray,
  );

  return { buffer, voxelIds, count: totalCount, valueRefs, dictionary };
}

self.onmessage = (e: MessageEvent<KasaneWorkerInput>) => {
  const { type, jobId, payload } = e.data;

  if (type === "PARSE_VOXELS") {
    const { buffer, voxelIds, count, valueRefs, dictionary } =
      processWorkerPayload(payload);

    self.postMessage(
      {
        type: "PARSE_VOXELS_RESULT",
        jobId,
        payload: { buffer, voxelIds, count, valueRefs, dictionary },
      },
      { transfer: [buffer.buffer, valueRefs.buffer] },
    );
  }
};
