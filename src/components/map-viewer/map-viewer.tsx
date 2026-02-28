import DeckGL from "@deck.gl/react";
import { Map } from "react-map-gl/maplibre";
import { useMap } from "../../context/map";
import { useTime } from "../../context/time";
import { useVoxel } from "../../context/voxel";
import styles from "./map-viewer.module.scss";
import generateLayer from "../../utils/generate-layers";

export default function MapViewer() {
	const { viewState, setViewState, isMapVisible, compileMode } = useMap();
	const { voxelItems, tooltipMap, voxelColorOverrides } = useVoxel();
	const { currentTime } = useTime();

	return (
		<div className={styles.mapContainer}>
			<DeckGL
				viewState={viewState}
				onViewStateChange={({ viewState }: any) => setViewState(viewState)}
				controller={{ maxZoom: 25 } as any}
				width="100%"
				height="100%"
				layers={generateLayer(
					voxelItems,
					compileMode,
					currentTime,
					voxelColorOverrides,
				)}
				getTooltip={({ object }) => {
					if (!object) return null;
					const tip = tooltipMap.get(object.voxelID);
					return { text: tip || object.voxelID };
				}}
			>
				{isMapVisible && (
					<Map
						mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
						renderWorldCopies={false}
					/>
				)}
			</DeckGL>
		</div>
	);
}
