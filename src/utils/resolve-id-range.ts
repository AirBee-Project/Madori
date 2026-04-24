import type { ResolvedId } from "../data/resolved-id";
import type { IdDefinition } from "../data/id-definition";

/**
 * 数値の場合範囲に変換する関数
 */
function toRange(item: [number, number] | number): [number, number] {
	if (typeof item === "number") return [item, item];
	return item;
}
/**
 * X,Y,Fの範囲表記を文字列に変換する関数
 */
function axisRangeToString(item: [number, number] | number): string {
	if (typeof item === "number") return String(item);
	return `${item[0]}:${item[1]}`;
}
/**
 * 時間範囲を文字列に変換する関数
 */
function timeRangeToString(startTime: number | null, endTime: number | null): string {
	if (startTime !== null && endTime !== null) return `${startTime}:${endTime}`;
	return "-";
}
/**
 * IdDefinition型からResolvedId型に変換する関数
 */
export default function toResolvedIds(
	Voxels: IdDefinition[],
	rangeMode: boolean = true,
): ResolvedId[] {
	if (rangeMode) {
		return rangeModeParse(Voxels);
	} else {
		return expandModeParse(Voxels);
	}
}
/**
 * 範囲表記のままResolvedId型に変換する関数
 */
function rangeModeParse(Voxels: IdDefinition[]): ResolvedId[] {
	const result: ResolvedId[] = [];

	for (let i = 0; i < Voxels.length; i++) {
		const v = Voxels[i];
		const [fMin, fMax] = toRange(v.F);
		const [yMin, yMax] = toRange(v.Y);
		const originalId = `${v.Z}/${axisRangeToString(v.F)}/${axisRangeToString(v.X)}/${axisRangeToString(v.Y)}/${timeRangeToString(v.startTime, v.endTime)}`;

		if (typeof v.X === "number") {
			result.push({
				Z: v.Z,
				X: v.X,
				X2: v.X,
				Y: yMin,
				Y2: yMax,
				F: fMin,
				F2: fMax,
				originalId,
				startTime: v.startTime,
				endTime: v.endTime,
			});
		} else {
			const [xStart, xEnd] = v.X;
			if (xStart <= xEnd) {
				result.push({
					Z: v.Z,
					X: xStart,
					X2: xEnd,
					Y: yMin,
					Y2: yMax,
					F: fMin,
					F2: fMax,
					originalId,
					startTime: v.startTime,
					endTime: v.endTime,
				});
			} else {
				const maxX = 2 ** v.Z - 1;
				result.push({
					Z: v.Z,
					X: xStart,
					X2: maxX,
					Y: yMin,
					Y2: yMax,
					F: fMin,
					F2: fMax,
					originalId,
					startTime: v.startTime,
					endTime: v.endTime,
				});
				result.push({
					Z: v.Z,
					X: 0,
					X2: xEnd,
					Y: yMin,
					Y2: yMax,
					F: fMin,
					F2: fMax,
					originalId,
					startTime: v.startTime,
					endTime: v.endTime,
				});
			}
		}
	}

	return result;
}
/**
 * 範囲表記のIDを全て展開してResolvedId型に変換する関数
 */
function expandModeParse(Voxels: IdDefinition[]): ResolvedId[] {
	const result: ResolvedId[] = [];

	for (let i = 0; i < Voxels.length; i++) {
		const v = Voxels[i];
		const xValues = enumerateXRange(v.X, v.Z);
		const yValues = enumerateRange(v.Y);
		const fValues = enumerateRange(v.F);

		for (const x of xValues) {
			for (const y of yValues) {
				for (const f of fValues) {
					result.push({
						Z: v.Z,
						X: x,
						X2: x,
						Y: y,
						Y2: y,
						F: f,
						F2: f,
						originalId: `${v.Z}/${f}/${x}/${y}/${timeRangeToString(v.startTime, v.endTime)}`,
						startTime: v.startTime,
						endTime: v.endTime,
					});
				}
			}
		}
	}

	return result;
}
/**
 * Y,Fの範囲表記を全て展開する関数
 */
function enumerateRange(item: [number, number] | number): number[] {
	if (typeof item === "number") return [item];
	const [start, end] = [...item].sort((a, b) => a - b);
	return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
/**
 * Xの範囲表記を全て展開する関数
 */
function enumerateXRange(
	item: [number, number] | number,
	zoomLevel: number,
): number[] {
	if (typeof item === "number") return [item];
	const [start, end] = item;
	if (start <= end) {
		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	}
	const maxX = 2 ** zoomLevel;
	const result: number[] = [];
	for (let x = start; x < maxX; x++) result.push(x);
	for (let x = 0; x <= end; x++) result.push(x);
	return result;
}
