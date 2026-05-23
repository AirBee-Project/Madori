import DeckGL from "@deck.gl/react";
import { Map as MapGL } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useState } from "react";
import { DrowmodeManager } from "./components/drow-mode-manager";
import { FeatureManager } from "./components/feature-manager";
import PointBox from "./components/feature-manager/point/PointBox";

export default function App() {
  //点のテスト用データ
  const [testPoint, setTestPoint] = useState({
    id: "dummy-point-1",
    latitude: 35.6812,
    longitude: 139.7671,
    altitude: 10,
    color: { r: 15, g: 118, b: 110, a: 255 },
  });
  return (
    <div>
      <div style={{ position: "absolute", zIndex: 50 }}>
        <FeatureManager />
      </div>
      {/* 点のテスト用UI */}
      <div
        style={{
          position: "absolute",
          zIndex: 50,
          top: "4rem",
          left: "1rem",
        }}
      >
        <PointBox
          point={testPoint}
          onUpdate={(_, updates) => setTestPoint((prev) => ({ ...prev, ...updates }))}
          onDelete={() => {}}
        />
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
