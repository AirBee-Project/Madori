import "maplibre-gl/dist/maplibre-gl.css";
import FooterControls from "./components/footer-controls";
import MapViewer from "./components/map-viewer";
import UpperControls from "./components/upper-controls";
import { ItemProvider, useItem } from "./context/item";
import { JsonProvider } from "./context/json";
import { MapProvider, useMap } from "./context/map";
import { TimeProvider, useTime } from "./context/time";
import styles from "./styles/app.module.css";

function AppContent() {
	const { items, setItems, focusOnVoxel, nextItemId, setNextItemId } =
		useItem();

	return (
		<JsonProvider
			items={items}
			setItems={setItems}
			nextItemId={nextItemId}
			setNextItemId={setNextItemId}
			focusOnVoxel={focusOnVoxel}
		>
			<div className={styles.appRoot}>
				<img src="/logo.png" className={styles.logo} alt="AirBee Logo" />
				<MapViewer />
				<UpperControls />
				<FooterControls />
			</div>
		</JsonProvider>
	);
}

function AppWithItem() {
	const { flyTo } = useMap();
	const { setCurrentTime } = useTime();

	return (
		<ItemProvider onFlyTo={flyTo} onTimeJump={setCurrentTime}>
			<AppContent />
		</ItemProvider>
	);
}

export default function App() {
	return (
		<MapProvider>
			<TimeProvider>
				<AppWithItem />
			</TimeProvider>
		</MapProvider>
	);
}
