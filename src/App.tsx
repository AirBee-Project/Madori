import DeckGL from "@deck.gl/react";
import { Map as MapGL } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { DrowmodeManager } from "./components/drow-mode-manager";
import { FeatureManager } from "./components/feature-manager";

export default function App() {
  return (
    <div>
      <div style={{ position: "absolute", zIndex: 50 }}>
        <FeatureManager />
      </div>
      <div
        style={{
          position: "absolute",
          zIndex: 50,
          bottom: "6rem",
          right: "1rem",
        }}
      >
        <DrowmodeManager />
      </div>
      <DeckGL
        initialViewState={{
          longitude: 139.767,
          latitude: 35.681,
          zoom: 10,
        }}
        controller={true}
        style={{ width: "100vw", height: "100vh" }}
      >
        <MapGL mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json" />
      </DeckGL>
    </div>
  );
}
