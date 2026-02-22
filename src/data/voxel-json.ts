export type KasaneJson = {
	meta: {
		kasaneSchemaVersion: string;
		description?: string;
	};
	option?: unknown;
	data: KasaneDataEntry[];
};

export type KasaneDataEntry = {
	name: string;
	value: unknown[];
	ids: KasaneId[];
};

export type KasaneId = {
	z: number;
	f?: [number] | [number, number];
	x?: [number] | [number, number];
	y?: [number] | [number, number];
	i?: number;
	t?: [number] | [number, number];
	ref: number;
};
