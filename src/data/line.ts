import type { Color } from "deck.gl";

/**
 * 線データ
 */
export type Line = {
	color: Color;
	opacity: number;
	size: number;
	lat1: number;
	lon1: number;
	lat2: number;
	lon2: number;
};
