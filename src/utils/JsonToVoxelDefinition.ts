import { KasaneJson, KasaneId } from "../types/KasaneJson";
import { VoxelDefinition } from "../types/VoxelDefinition";

export type JsonVoxelResult = {
    voxelDefs: VoxelDefinition[];
    tooltipMap: Map<string, string>;
};

function spatialKey(id: KasaneId): string {
    const z = id.z;
    const f = id.f ? (id.f.length === 2 ? `${id.f[0]}:${id.f[1]}` : `${id.f[0]}`) : "-";
    const x = id.x ? (id.x.length === 2 ? `${id.x[0]}:${id.x[1]}` : `${id.x[0]}`) : "-";
    const y = id.y ? (id.y.length === 2 ? `${id.y[0]}:${id.y[1]}` : `${id.y[0]}`) : "-";
    return `${z}/${f}/${x}/${y}`;
}

function parseDim(
    dim: [number] | [number, number] | undefined,
    zoomLevel: number,
    isDimF: boolean
): number | [number, number] {
    if (dim === undefined) {
        if (isDimF) {
            return [2 ** zoomLevel - 1, -(2 ** zoomLevel)];
        } else {
            return zoomLevel === 0 ? 0 : [0, 2 ** zoomLevel - 1];
        }
    }
    if (dim.length === 1) {
        return dim[0];
    }
    return [dim[0], dim[1]];
}

function parseTime(id: KasaneId): { startTime: number | null; endTime: number | null } {
    if (id.i === undefined || id.t === undefined) {
        return { startTime: null, endTime: null };
    }
    const interval = id.i;
    if (id.t.length === 1) {
        return { startTime: interval * id.t[0], endTime: interval * (id.t[0] + 1) };
    }
    const [t1, t2] = id.t;
    return { startTime: interval * t1, endTime: interval * (t2 + 1) };
}

function formatValue(value: unknown): string {
    if (typeof value === "object" && value !== null) {
        return JSON.stringify(value);
    }
    return String(value);
}

export default function jsonToVoxelDefinition(json: KasaneJson): JsonVoxelResult {
    const voxelDefs: VoxelDefinition[] = [];
    const tooltipMap = new Map<string, string>();
    const seenKeys = new Set<string>();

    for (const dataEntry of json.data) {
        for (const id of dataEntry.ids) {
            const z = id.z;
            const F = parseDim(id.f, z, true);
            const X = parseDim(id.x, z, false);
            const Y = parseDim(id.y, z, false);
            const { startTime, endTime } = parseTime(id);

            const key = spatialKey(id);
            if (!seenKeys.has(key)) {
                voxelDefs.push({ Z: z, F, X, Y, startTime, endTime });
                seenKeys.add(key);
            }

            const refValue = dataEntry.value[id.ref];
            const valueText = `${dataEntry.name}: ${formatValue(refValue)}`;
            const existing = tooltipMap.get(key);
            tooltipMap.set(key, existing ? `${existing}\n${valueText}` : `${key} | ${valueText}`);
        }
    }

    return { voxelDefs, tooltipMap };
}
