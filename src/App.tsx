import "maplibre-gl/dist/maplibre-gl.css";
import FooterControls from "./components/footer-controls/footer-controls";
import MapViewer from "./components/map-viewer/map-viewer";
import UpperControls from "./components/upper-controls/upper-controls";
import { JsonProvider } from "./context/json";
import { MapProvider, useMap } from "./context/map";
import { TimeProvider, useTime } from "./context/time";
import { VoxelProvider } from "./context/voxel";
import styles from "./styles/app.module.scss";

function AppContent() {
	return (
		<JsonProvider>
			<div className={styles.appRoot}>
				<img
					src={`${import.meta.env.BASE_URL}logo.png`}
					className={styles.logo}
					alt="AirBee Logo"
				/>
				<MapViewer />
				<UpperControls />
				<FooterControls />
			</div>
		</JsonProvider>
	);
}

function AppWithVoxel() {
	const { flyTo } = useMap();
	const { setCurrentTime } = useTime();

	return (
		<VoxelProvider onFlyTo={flyTo} onTimeJump={setCurrentTime}>
			<AppContent />
		</VoxelProvider>
	);
}

export default function App() {
	return (
		<MapProvider>
			<TimeProvider>
				<AppWithVoxel />
			</TimeProvider>
		</MapProvider>
	);
}
