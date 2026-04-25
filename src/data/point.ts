import type { Color } from "deck.gl";
	
/**
 * 点データ
 */
export type Point = {
	color: Color;
	opacity: number;
	size: number;
	lat: number;
	lon: number;
};
