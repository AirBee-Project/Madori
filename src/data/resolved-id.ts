/**
 * IdDefinitionのunion型を解消した時空間ID
 */
export type ResolvedId = {
	Z: number;
	X: number;
	X2: number;
	Y: number;
	Y2: number;
	F: number;
	F2: number;
	originalId: string;
	startTime: number | null;
	endTime: number | null;
};
