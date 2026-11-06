import madoriLogo from "/Madori_logo.png";
import { DrawModeToolbar } from "./components/draw-mode-manager";
import MapContainer from "./components/map/MapContainer";
import { Sidebar } from "./components/sidebar";
import { TimePanel } from "./components/time-manager";
import { useEmbedStore } from "./stores/embedStore";

export default function App() {
  const viewOnly = useEmbedStore((state) => state.viewOnly);
  const hasTime = useEmbedStore((state) => state.hasTime);

  return (
    <div>
      {!viewOnly && <Sidebar />}

      <img src={madoriLogo} alt="Madori Logo" className="madori-logo" />

      {/* timebar（表示専用でも、時間のあるデータなら出す） */}
      {(!viewOnly || hasTime) && <TimePanel />}

      {!viewOnly && (
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
      )}

      <MapContainer />
    </div>
  );
}
