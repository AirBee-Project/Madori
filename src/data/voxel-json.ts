/**
 * インポートされるJsonの型定義
 */
export type KasaneJson = {
	meta: {
		kasaneSchemaVersion: string;
		description?: string;
	};
	option?: unknown;
	data: KasaneDataEntry[];
};
/**
 * 同じnameを持つID群の型
 */
export type KasaneDataEntry = {
	name: string;
	value: unknown[];
	ids: KasaneId[];
};

/**
 * JSONファイルから変換したIDの型
 * （形自体はIdDefinitionと同じ）
 */
export type KasaneId = {
	z: number;
	f?: [number] | [number, number];
	x?: [number] | [number, number];
	y?: [number] | [number, number];
	i?: number;
	t?: [number] | [number, number];
	ref: number;
};
