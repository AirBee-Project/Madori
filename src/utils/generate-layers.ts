import { GeoJsonLayer, SolidPolygonLayer } from "@deck.gl/layers";
import type { Color, LayersList } from "deck.gl";
import type { GeoJSON } from "geojson";
import type { Item } from "../data/item";
import toVoxelGeometry from "./id-to-voxel";
import toResolvedIds from "./resolve-id-range";
import type { VoxelGeometry } from "../data/voxel-geometry";

/**
 * Itemから描画用レイヤーを生成する関数
 * (Deck.glに渡して描画)
 */
export default function generateLayer(
	item: Item[],
	rangeMode: boolean = true,
	currentTime: number = 0,
	voxelColorOverrides?: globalThis.Map<
		string,
		[number, number, number, number]
	>,
): LayersList {
	const pointItem: Item<"point">[] = item.filter(
		(e): e is Item<"point"> =>
			!e.isDeleted && !e.isVisible && e.type === "point",
	);
	const lineItem: Item<"line">[] = item.filter(
		(e): e is Item<"line"> => !e.isDeleted && !e.isVisible && e.type === "line",
	);

	const voxelItem: Item<"voxel">[] = item.filter(
		(e): e is Item<"voxel"> =>
			!e.isDeleted && !e.isVisible && e.type === "voxel",
	);
	/**
	 * 点レイヤーオブジェクト
	 */
	const pointGeoJsonLayer = new GeoJsonLayer({
		id: "GeoJsonLayer",
		data: generatePointGeoJson(pointItem),
		pickable: true,
		filled: true,
		pointRadiusUnits: "pixels",
		pointRadiusMinPixels: 1,
		pointRadiusScale: 1,
		getFillColor: (d) => d.properties.color,
		getRadius: (d) => d.properties.radius,
	});

	/**
	 * 線レイヤーオブジェクト
	 */
	const lineGeoJsonLayer = new GeoJsonLayer({
		id: "geojson-lines",
		data: generateLineGeoJson(lineItem),
		pickable: true,
		stroked: true,
		filled: false,
		lineWidthUnits: "pixels",
		getLineColor: (d) => d.properties.color as Color,
		getLineWidth: (d) => d.properties.width,
	});

	/**
	 * ボクセルレイヤーオブジェクト
	 */
	const voxelPolygonLayer = new SolidPolygonLayer({
		id: "SolidPolygonLayer",
		data: generatePolygonLayer(
			voxelItem,
			rangeMode,
			currentTime,
			voxelColorOverrides,
		),
		extruded: true,
		getPolygon: (d) => d.points,
		getElevation: (d) => d.elevation,
		getFillColor: (d) => d.color,
		pickable: true,
		autoHighlight: true,
		highlightColor: [255, 255, 0, 200],
	});

	/**
	 * 描画するレイヤーリスト
	 */
	const result: LayersList = [
		pointGeoJsonLayer,
		lineGeoJsonLayer,
		voxelPolygonLayer,
	];
	return result;
}
/**
 * 点のGeoJSONを生成する関数
 */
function generatePointGeoJson(point: Item<"point">[]): GeoJSON {
	const result: GeoJSON = {
		type: "FeatureCollection",
		features: [],
	};

	for (let i = 0; i < point.length; i++) {
		result.features.push({
			type: "Feature",
			properties: {
				color: point[i].data.color,
				radius: point[i].data.size,
			},
			geometry: {
				type: "Point",
				coordinates: [point[i].data.lon, point[i].data.lat],
			},
		});
	}

	return result;
}
/**
 * 線のGeoJSONを生成する関数
 */
function generateLineGeoJson(line: Item<"line">[]): GeoJSON {
	const result: GeoJSON = {
		type: "FeatureCollection",
		features: [],
	};
	for (let i = 0; i < line.length; i++) {
		result.features.push({
			type: "Feature",
			geometry: {
				type: "LineString",
				coordinates: [
					[line[i].data.lon1, line[i].data.lat1],
					[line[i].data.lon2, line[i].data.lat2],
				],
			},
			properties: {
				color: line[i].data.color,
				width: line[i].data.size,
			},
		});
	}
	return result;
}

/**
 * ボクセルの描画用オブジェクトを生成する関数
 */
function generatePolygonLayer(
	voxel: Item<"voxel">[],
	rangeMode: boolean,
	currentTime: number,
	voxelColorOverrides?: globalThis.Map<
		string,
		[number, number, number, number]
	>,
): VoxelGeometry[] {
	const result: VoxelGeometry[] = [];
	for (let i = 0; i < voxel.length; i++) {
		const resolvedIds = toResolvedIds(voxel[i].data.voxel, rangeMode);
		const geometry = toVoxelGeometry(resolvedIds, voxel[i].data.color);
		for (const p of geometry) {
			if (voxelColorOverrides && voxelColorOverrides.size > 0) {
				const override = voxelColorOverrides.get(p.voxelID);
				if (override) {
					p.color = override;
				}
			}
			if (p.startTime === null && p.endTime === null) {
				result.push(p);
			} else if (
				p.startTime !== null &&
				p.endTime !== null &&
				p.startTime <= currentTime &&
				currentTime < p.endTime
			) {
				result.push(p);
			}
		}
	}
	return result;
}
