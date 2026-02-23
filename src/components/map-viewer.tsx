import DeckGL from "@deck.gl/react";
import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useItem } from "../context/item";
import { useJson } from "../context/json";
import { useMap } from "../context/map";
import { useTime } from "../context/time";
import styles from "../styles/map-viewer.module.css";
import generateLayer from "../utils/generate-layers";

export default function MapViewer() {
	const { viewState, setViewState, isMapVisible, compileMode } = useMap();
	const { items } = useItem();
	const { currentTime } = useTime();
	const { tooltipMap } = useJson();

	return (
		<div className={styles.mapContainer}>
			<DeckGL
				viewState={viewState}
				onViewStateChange={({ viewState }: any) => setViewState(viewState)}
				controller={{ maxZoom: 25 } as any}
				width="100%"
				height="100%"
				layers={generateLayer(items, compileMode, currentTime)}
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
