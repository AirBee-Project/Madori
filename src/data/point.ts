import type { Color } from "deck.gl";

export type Point = {
	color: Color;
	opacity: number;
	size: number;
	lat: number;
	lon: number;
};
