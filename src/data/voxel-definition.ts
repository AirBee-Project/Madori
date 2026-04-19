export type VoxelDefinition = {
	Z: number;
	X: [number, number] | number;
	Y: [number, number] | number;
	F: [number, number] | number;
	startTime: number | null;
	endTime: number | null;
};
