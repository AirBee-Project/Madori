/**
 * 時空間IDパース直後の定義
 */
export type IdDefinition = {
	Z: number;
	X: [number, number] | number;
	Y: [number, number] | number;
	F: [number, number] | number;
	startTime: number | null;
	endTime: number | null;
};
