import type { IdDefinition } from "../data/id-definition";
import type { KasaneId, KasaneJson } from "../data/voxel-json";
import { parseTime, toIdString } from "./id-utils";

export type JsonVoxelResult = {
	voxelDefs: IdDefinition[];
	tooltipMap: Map<string, string>;
};

/**
 * 範囲表記を補完する関数
 */
function parseDim(
	dim: [number] | [number, number] | undefined,
	zoomLevel: number,
	isDimF: boolean,
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



function formatValue(value: unknown): string {
	if (typeof value === "object" && value !== null) {
		return JSON.stringify(value);
	}
	return String(value);
}

/**
 * JsonファイルをIdDefinitionに変換する関数
 */
export default function jsonToIdDefinition(
	json: KasaneJson,
): JsonVoxelResult {
	const voxelDefs: IdDefinition[] = [];
	const tooltipMap = new Map<string, string>();
	const seenKeys = new Set<string>();

	for (const dataEntry of json.data) {
		for (const id of dataEntry.ids) {
			const z = id.z;
			const F = parseDim(id.f, z, true);
			const X = parseDim(id.x, z, false);
			const Y = parseDim(id.y, z, false);
			const { startTime, endTime } = parseTime(id);

			const key = toIdString(id);
			if (!seenKeys.has(key)) {
				voxelDefs.push({ Z: z, F, X, Y, startTime, endTime });
				seenKeys.add(key);
			}

			const refValue = dataEntry.value[id.ref];
			const valueText = `${dataEntry.name}: ${formatValue(refValue)}`;
			const existing = tooltipMap.get(key);
			tooltipMap.set(
				key,
				existing ? `${existing}\n${valueText}` : `${key}\n${valueText}`,
			);
		}
	}

	return { voxelDefs, tooltipMap };
}
