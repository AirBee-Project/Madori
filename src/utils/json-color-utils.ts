import { preset_colors } from "../data/colors";

/**
 * 配列の中身がすべてプリミティブな値（文字列、数値、真偽値）かどうかを判定します。
 */
export function isPrimitiveArray(values: unknown[]): boolean {
	return values.every(
		(v) =>
			typeof v === "string" || typeof v === "number" || typeof v === "boolean",
	);
}

/**
 * 配列の中から重複を排除し、文字列の配列として返します。
 */
export function uniqueValues(values: unknown[]): string[] {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const v of values) {
		const s = String(v);
		if (!seen.has(s)) {
			seen.add(s);
			result.push(s);
		}
	}
	return result;
}

/**
 * 16進数のカラーコード（Hex）をRGBA形式の配列に変換します。
 */
export function hexToRgba(
	hex: string,
	alpha: number,
): [number, number, number, number] {
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	return [r, g, b, alpha];
}

/**
 * 事前に定義されたカラーパレットを使って、値と色の初期マッピングを構築します。
 */
export function buildInitialColorMap(
	values: string[],
): Map<string, [number, number, number, number]> {
	const map = new Map<string, [number, number, number, number]>();
	for (let i = 0; i < values.length; i++) {
		map.set(values[i], hexToRgba(preset_colors[i % preset_colors.length], 200));
	}
	return map;
}

/**
 * 各ボクセル情報から、一意なID（文字列表現）を生成します。
 */
export function voxelKey(id: {
	z: number;
	f?: [number] | [number, number];
	x?: [number] | [number, number];
	y?: [number] | [number, number];
	i?: number;
	t?: [number] | [number, number];
}): string {
	const z = id.z;
	const f = id.f
		? id.f.length === 2
			? `${id.f[0]}:${id.f[1]}`
			: `${id.f[0]}`
		: "-";
	const x = id.x
		? id.x.length === 2
			? `${id.x[0]}:${id.x[1]}`
			: `${id.x[0]}`
		: "-";
	const y = id.y
		? id.y.length === 2
			? `${id.y[0]}:${id.y[1]}`
			: `${id.y[0]}`
		: "-";
	let t = "-";
	if (id.t && id.i !== undefined) {
		const interval = id.i;
		if (id.t.length === 1) {
			const start = interval * id.t[0];
			const end = interval * (id.t[0] + 1);
			t = `${start}:${end}`;
		} else {
			const start = interval * id.t[0];
			const end = interval * (id.t[1] + 1);
			t = `${start}:${end}`;
		}
	}
	return `${z}/${f}/${x}/${y}/${t}`;
}
