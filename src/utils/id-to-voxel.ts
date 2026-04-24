import type { Color } from "deck.gl";
import type { ResolvedId } from "../data/resolved-id";

type VoxelGeometry = {
	points: number[][];
	elevation: number;
	voxelID: string;
	color: Color;
	startTime: number | null;
	endTime: number | null;
};

type VoxelBounds = {
	maxLon: number;
	minLon: number;
	maxLat: number;
	minLat: number;
};
/**
 * ResolvedId型からVoxelGeometry型に変換する関数
 * （IDからDeck.glに渡す用の座標変換を行う関数）
 */
export default function toVoxelGeometry(
	ids: ResolvedId[],
	color: Color,
): VoxelGeometry[] {
	return ids.map((voxel) => {
		const coordinates = idToCoordinates(voxel);
		const altitude = idToAltitude(voxel);
		const points = generateRectanglePoints(coordinates, altitude);

		return {
			points,
			elevation: idToElevation(voxel),
			voxelID: voxel.originalId,
			color: color,
			startTime: voxel.startTime,
			endTime: voxel.endTime,
		};
	});
}

/**
 * IDから緯度経度に変換する関数
 */
function idToCoordinates(voxel: ResolvedId): VoxelBounds {
	const n = 2 ** voxel.Z;
	const lonPerTile = 360 / n;

	const minLon = -180 + lonPerTile * voxel.X;
	const maxLon = -180 + lonPerTile * (voxel.X2 + 1);

	const maxLat =
		(Math.atan(Math.sinh(Math.PI - (voxel.Y / n) * 2 * Math.PI)) * 180) /
		Math.PI;
	const minLat =
		(Math.atan(Math.sinh(Math.PI - ((voxel.Y2 + 1) / n) * 2 * Math.PI)) * 180) /
		Math.PI;

	return { maxLon, minLon, maxLat, minLat };
}

/**
 * IDから高度に変換する関数
 */
function idToAltitude(voxel: ResolvedId): number {
	return (33554432 / 2 ** voxel.Z) * voxel.F;
}

/**
 * 緯度経度からボクセルの底面を生成する関数
 */
function generateRectanglePoints(
	coord: VoxelBounds,
	altitude: number,
): number[][] {
	const { maxLon, minLon, maxLat, minLat } = coord;

	return [
		[maxLon, maxLat, altitude],
		[minLon, maxLat, altitude],
		[minLon, minLat, altitude],
		[maxLon, minLat, altitude],
		[maxLon, maxLat, altitude],
	];
}

/**
 * IDから底面からの高さを計算する関数
 */
function idToElevation(voxel: ResolvedId): number {
	const fCount = voxel.F2 - voxel.F + 1;
	return (33554432 / 2 ** voxel.Z) * fCount;
}
