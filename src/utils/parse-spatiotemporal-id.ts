import type { IdDefinition } from "../data/id-definition";

/**
 * 入力された時空間ID文字列をパースして IdDefinition の配列に変換
 */
export default function parseSpatiotemporalId(
	voxelsString: string,
): IdDefinition[] {
	voxelsString = voxelsString.replace("[", "");
	voxelsString = voxelsString.replace("]", "");
	voxelsString = voxelsString.replace(/'/g, "");

	const idStrings = voxelsString
		.split(",")
		.filter((v) => v.trim() !== "");

	if (idStrings.length === 0) {
		return [];
	}

	const result: IdDefinition[] = [];

	for (const idString of idStrings) {
		const trimmed = idString.trim();
		if (trimmed === "") continue;

		let spatialPart = trimmed;
		let timePart: string | null = null;

		const underscoreIndex = trimmed.indexOf("_");
		if (underscoreIndex !== -1) {
			spatialPart = trimmed.substring(0, underscoreIndex);
			timePart = trimmed.substring(underscoreIndex + 1);
		}

		const parts = spatialPart.split("/");
		const zoomLevel = Number(parts[0]);

		const { startTime, endTime } = parseTimePart(timePart);

		result.push({
			Z: zoomLevel,
			F: parseAxisValue(zoomLevel, "F", parts[1]),
			X: parseAxisValue(zoomLevel, "X", parts[2]),
			Y: parseAxisValue(zoomLevel, "Y", parts[3]),
			startTime,
			endTime,
		});
	}

	return result;
}

/**
 * X, Y, Fの文字列を数値または範囲に変換
 */
function parseAxisValue(
	zoomLevel: number,
	dimension: "X" | "Y" | "F",
	item: string,
): number | [number, number] {
	const isFloor = dimension === "F";
	const maxVal = 2 ** zoomLevel - 1;
	const minDefault = isFloor ? -(2 ** zoomLevel) : 0;

	if (item === "-") {
		if (isFloor) {
			return [maxVal, minDefault];
		}
		if (zoomLevel === 0) {
			return 0;
		}
		return [0, maxVal];
	}

	if (item.endsWith(":-")) {
		const start = Number(item.split(":")[0]);
		return [start, maxVal];
	}

	if (item.startsWith("-:")) {
		const end = Number(item.split(":")[1]);
		return [minDefault, end];
	}
	if (item.includes(":")) {
		const [start, end] = item.split(":").map(Number);
		if (dimension !== "X") {
			return [Math.min(start, end), Math.max(start, end)];
		}
		return [start, end];
	}

	return Number(item);
}

/**
 * 時間部分のパースと開始・終了時間の範囲変換
 */
function parseTimePart(timePart: string | null): {
	startTime: number | null;
	endTime: number | null;
} {
	if (timePart === null) {
		return { startTime: null, endTime: null };
	}

	const parts = timePart.split("/");
	const interval = Number(parts[0]);
	const tPart = parts[1];

	if (tPart === "-") {
		return { startTime: null, endTime: null };
	}
	if (tPart.endsWith(":-")) {
		const t = Number(tPart.split(":")[0]);
		return { startTime: interval * t, endTime: Infinity };
	}
	if (tPart.startsWith("-:")) {
		const t = Number(tPart.split(":")[1]);
		return { startTime: 0, endTime: interval * (t + 1) };
	}
	if (tPart.includes(":")) {
		const [t1, t2] = tPart.split(":").map(Number);
		return { startTime: interval * t1, endTime: interval * (t2 + 1) };
	}
	const t = Number(tPart);
	return { startTime: interval * t, endTime: interval * (t + 1) };
}
