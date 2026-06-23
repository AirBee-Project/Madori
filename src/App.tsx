import madoriLogo from "/Madori_logo.png";
import { DrawModeToolbar } from "./components/draw-mode-manager";
import { FeatureManager } from "./components/feature-manager";
import MapContainer from "./components/map/MapContainer";
import { TimePanel } from "./components/time-manager";

export default function App() {
  return (
    <div>
      {/* featuremanager */}
      <div style={{ position: "absolute", zIndex: 50 }}>
        <FeatureManager />
      </div>

      {/* logo */}
      <img
        src={madoriLogo}
        alt="Madori Logo"
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          zIndex: 50,
          height: "40px", // adjust height as needed
          pointerEvents: "none",
        }}
      />

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
    </div>
  );
}
