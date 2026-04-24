import type { MapViewState, PickingInfo } from "@deck.gl/core";
import { useMemo } from "react";
import DeckGL from "@deck.gl/react";
import { Map as MapGL } from "react-map-gl/maplibre";
import { useMap } from "../../context/map";
import { useTime } from "../../context/time";
import { useVoxel } from "../../context/voxel";
import generateLayer from "../../utils/generate-layers";
import styles from "./map-viewer.module.scss";

/**
 * 地図のベースレイヤーと時空間IDの描画コンポーネント
 */
export default function MapViewer() {
	const { viewState, setViewState, isMapVisible, rangeMode } = useMap();
	const { voxelItems, tooltipMap, voxelColorOverrides } = useVoxel();
	const { currentTime } = useTime();
	
	//値が変化した時のみ再計算を行う
	const layers = useMemo(() => {
		return generateLayer(
			voxelItems,
			rangeMode,
			currentTime,
			voxelColorOverrides,
		);
	}, [voxelItems, rangeMode, currentTime, voxelColorOverrides]);

	/**
	 * 視点の更新
	 */
	const handleViewStateChange = ({ viewState }: { viewState: unknown }) => {
		setViewState(viewState as MapViewState);
	};

	/**
	 * ボクセルに触れたときのID・付随情報の表示
	 */
	const handleGetTooltip = ({ object }: PickingInfo) => {
		if (!object) return null;
		const voxelId = (object as any).voxelID;
		const tip = tooltipMap.get(voxelId);
		
		return { text: tip || voxelId };
	};

	return (
		<div className={styles.mapContainer}>
			<DeckGL
				viewState={viewState}
				onViewStateChange={handleViewStateChange}
				controller={{ maxZoom: 25 } as Record<string, unknown>}
				width="100%"
				height="100%"
				layers={layers}
				getTooltip={handleGetTooltip}
			>
				{isMapVisible && (
					<MapGL
						mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
						renderWorldCopies={false}
					/>
				)}
			</DeckGL>
		</div>
	);
}
