import { DrawModeToolbar } from "./components/draw-mode-manager";
import { FeatureManager } from "./components/feature-manager";
import KasaneLoadingOverlay from "./components/map/KasaneLoadingOverlay";
import KasaneViewportLoader from "./components/map/KasaneViewportLoader";
import MapContainer from "./components/map/MapContainer";
import { TimePanel } from "./components/time-manager";

export default function App() {
  return (
    <div>
      {/* featuremanager */}
      <div style={{ position: "absolute", zIndex: 50 }}>
        <FeatureManager />
      </div>

      {/* timebar */}
      <TimePanel />

      {/* drawmodemanager */}
      <div
        style={{
          position: "absolute",
          zIndex: 50,
          bottom: "6rem",
          right: "1rem",
        }}
      >
        <DrawModeToolbar />
      </div>

      {/* map */}
      <MapContainer />

      {/* Kasane: 表示範囲のデータを動的ロード（UIなし） */}
      <KasaneViewportLoader />

      {/* Kasane: 読み込み中の領域を可視化 */}
      <KasaneLoadingOverlay />
    </div>
  );
}
