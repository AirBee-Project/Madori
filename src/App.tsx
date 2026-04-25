import DeckGL from "@deck.gl/react";
import { Map as MapGL } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { FeatureManager } from "./components/feature-manager";

export default function App() {
  return (
    <div>
      <div style={{ position: "absolute", zIndex: 50 }}>
        <FeatureManager />
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
