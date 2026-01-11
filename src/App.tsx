import DeckGL from "@deck.gl/react";
import { MapView, FlyToInterpolator, WebMercatorViewport } from "deck.gl";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Item } from "./types/Item";
import Point from "./components/Point";
import Line from "./components/Line";
import Voxel from "./components/Voxel";
import generateLayer from "./utils/GenerateLayer";
import hyperVoxelParse from "./utils/HyperVoxelParse";
import hyperVoxelToPureVoxel from "./utils/HyperVoxelToPureVoxel";
import { pvoxelToCoordinates } from "./utils/PureVoxelToPolygon";

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 0,
  zoom: 1,
  pitch: 60,
  bearing: 30,
};

// Define ViewState type allowing transitions
type CustomViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  transitionDuration?: number;
  transitionInterpolator?: any;
};

export default function App() {
  const [item, setItem] = useState<Item[]>([]);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [viewState, setViewState] = useState<CustomViewState>(INITIAL_VIEW_STATE);

  // Load voxel from URL parameters on initial mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const voxelData = urlParams.get("voxel");
    const colorParam = urlParams.get("color");

    if (voxelData) {
      try {
        // Normalize color parameter - add # if not present
        let color = colorParam || "#0000FF";
        if (colorParam && !colorParam.startsWith("#")) {
          color = `#${colorParam}`;
        }

        const parsedVoxel = hyperVoxelParse(voxelData);
        // カメラ移動の計算: 最初のボクセルの中心に移動
        if (parsedVoxel.length > 0) {
          const pureVoxels = hyperVoxelToPureVoxel([parsedVoxel[0]]); // 代表点として1つだけ計算
          if (pureVoxels.length > 0) {
            const coords = pvoxelToCoordinates(pureVoxels[0]);
            const centerLon = (coords.maxLon + coords.minLon) / 2;
            const centerLat = (coords.maxLat + coords.minLat) / 2;

            // ズームレベルはボクセルのZレベルに応じて調整
            // 高Zレベル（小さいボクセル）の場合はより近くにズーム
            // Z=25で1mボクセル、Z=30で3cmボクセル
            const targetZoom = Math.min(28, Math.max(2, pureVoxels[0].Z));

            setViewState({
              ...INITIAL_VIEW_STATE,
              longitude: centerLon,
              latitude: centerLat,
              zoom: targetZoom,
              transitionDuration: 3000,
              transitionInterpolator: new FlyToInterpolator(),
            });
            console.log(`Flying to: ${centerLat}, ${centerLon} (Zoom: ${targetZoom})`);
          }
        }

        const newVoxel: Item = {
          id: 1,
          type: "voxel",
          isDeleted: false,
          isVisible: false,
          data: {
            color: color,
            opacity: 30,
            voxel: parsedVoxel,
            voxelString: voxelData,
          },
        };
        setItem([newVoxel]);
      } catch (error) {
        console.error("Failed to parse voxel data from URL parameters:", error);
      }
    }
  }, []);

  const addObject = useCallback((type: "point" | "line" | "voxel") => {
    let newObject: Item = {
      id: item.length > 0 ? Math.max(...item.map(i => i.id)) + 1 : 1,
      type: type,
      isDeleted: false,
      isVisible: true,
      data:
        type === "point"
          ? {
            color: "#FF0000",
            opacity: 80,
            size: 10,
            lat: 0,
            lon: 0,
          }
          : type === "line"
            ? {
              color: "#00FF00",
              opacity: 80,
              size: 10,
              lat1: 0,
              lon1: 0,
              lat2: 45,
              lon2: 45,
            }
            : {
              color: "#0000FF",
              opacity: 30,
              voxel: [],
              voxelString: "", // Added to satisfy Voxel data potentially
            },
    };
    setItem((prevItems) => [...prevItems, newObject]);
  }, [item]);

  function onViewStateChange({ viewState }: { viewState: any }) {
    setViewState(viewState);
  }

  // 描画精度の実測定関数
  useEffect(() => {
    (window as any).measureRenderingPrecision = (lon: number, lat: number) => {
      // 現在のビューポートを作成
      const viewport = new WebMercatorViewport({
        ...viewState,
        width: 1000,
        height: 1000,
      });

      console.group("=== 描画精度の実測定 ===");
      console.log(`入力座標: [${lon.toFixed(15)}, ${lat.toFixed(15)}]`);
      console.log(`ズームレベル: ${viewState.zoom}`);

      // project: 座標 → ピクセル
      const [px, py] = viewport.project([lon, lat]);
      console.log(`投影ピクセル: [${px.toFixed(10)}, ${py.toFixed(10)}]`);

      // unproject: ピクセル → 座標
      const [unprojLon, unprojLat] = viewport.unproject([px, py]);
      console.log(`逆投影座標: [${unprojLon.toFixed(15)}, ${unprojLat.toFixed(15)}]`);

      // 誤差計算
      const lonError = Math.abs(lon - unprojLon);
      const latError = Math.abs(lat - unprojLat);

      // メートルに変換
      const latRad = (lat * Math.PI) / 180;
      const metersPerLon = 111319.49079327358 * Math.cos(latRad);
      const metersPerLat = 111319.49079327358;

      const lonErrorMeters = lonError * metersPerLon;
      const latErrorMeters = latError * metersPerLat;
      const totalErrorMeters = Math.sqrt(lonErrorMeters ** 2 + latErrorMeters ** 2);

      console.log(`経度誤差: ${lonError.toExponential(6)} 度 = ${(lonErrorMeters * 1000).toFixed(9)} mm`);
      console.log(`緯度誤差: ${latError.toExponential(6)} 度 = ${(latErrorMeters * 1000).toFixed(9)} mm`);
      console.log(`合計誤差: ${(totalErrorMeters * 1000).toFixed(9)} mm`);

      // 1ピクセルあたりの距離
      const [px2] = viewport.project([lon + 0.0000001, lat]);
      const pixelPerDegree = Math.abs(px2 - px) / 0.0000001;
      const meterPerPixel = metersPerLon / pixelPerDegree;
      console.log(`1ピクセル = ${meterPerPixel.toFixed(6)} m`);

      console.groupEnd();

      return {
        lonError,
        latError,
        lonErrorMeters,
        latErrorMeters,
        totalErrorMm: totalErrorMeters * 1000,
        meterPerPixel,
      };
    };

    console.log("精度実測定: window.measureRenderingPrecision(lon, lat) を使用可能");

    // 片道ピクセル誤差測定（高緯度での増幅効果を測定）
    (window as any).measureOneWayPixelError = (lon: number, lat: number) => {
      const viewport = new WebMercatorViewport({
        ...viewState,
        width: 1000,
        height: 1000,
      });

      console.group("=== 片道ピクセル誤差測定（高緯度増幅効果） ===");
      console.log(`入力座標: [${lon}, ${lat}]`);
      console.log(`ズームレベル: ${viewState.zoom}`);

      // deck.gl の project 結果
      const [deckPx, deckPy] = viewport.project([lon, lat]);

      // 理論的なメルカトル計算（手動で高精度計算）
      const TILE_SIZE = 512;
      const scale = TILE_SIZE * Math.pow(2, viewState.zoom);

      // 理論X（経度から）
      const theoreticalWorldX = (lon + 180) / 360 * scale;

      // 理論Y（緯度から、メルカトル投影）
      const latRad = lat * Math.PI / 180;
      const mercatorY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
      const theoreticalWorldY = (1 - mercatorY / Math.PI) / 2 * scale;

      // ビューポート中心のワールド座標
      const centerLatRad = viewState.latitude * Math.PI / 180;
      const centerMercatorY = Math.log(Math.tan(Math.PI / 4 + centerLatRad / 2));
      const centerWorldX = (viewState.longitude + 180) / 360 * scale;
      const centerWorldY = (1 - centerMercatorY / Math.PI) / 2 * scale;

      // 理論的なスクリーン座標
      const theoreticalPx = 500 + (theoreticalWorldX - centerWorldX);
      const theoreticalPy = 500 + (theoreticalWorldY - centerWorldY);

      // ピクセル誤差
      const pxError = Math.abs(deckPx - theoreticalPx);
      const pyError = Math.abs(deckPy - theoreticalPy);
      const totalPixelError = Math.sqrt(pxError ** 2 + pyError ** 2);

      // 1ピクセルあたりのメートル数
      const metersPerLon = 111319.49079327358 * Math.cos(latRad);
      const degreesPerPixel = 360 / scale;
      const metersPerPixel = degreesPerPixel * metersPerLon;

      // ピクセル誤差をメートルに変換
      const errorMeters = totalPixelError * metersPerPixel;

      console.log(`deck.gl project: [${deckPx.toFixed(10)}, ${deckPy.toFixed(10)}]`);
      console.log(`理論計算値: [${theoreticalPx.toFixed(10)}, ${theoreticalPy.toFixed(10)}]`);
      console.log(`X誤差: ${pxError.toExponential(6)} pixels`);
      console.log(`Y誤差: ${pyError.toExponential(6)} pixels`);
      console.log(`合計ピクセル誤差: ${totalPixelError.toExponential(6)} pixels`);
      console.log(`1ピクセル = ${metersPerPixel.toFixed(6)} m`);
      console.log(`距離誤差: ${(errorMeters * 1000).toFixed(9)} mm`);

      // メルカトル増幅係数
      const mercatorAmplification = 1 / Math.cos(latRad);
      console.log(`メルカトル増幅係数（1/cos(lat)）: ${mercatorAmplification.toFixed(4)}`);

      console.groupEnd();

      return {
        deckPx, deckPy,
        theoreticalPx, theoreticalPy,
        pxError, pyError,
        totalPixelError,
        errorMm: errorMeters * 1000,
        metersPerPixel,
        mercatorAmplification,
      };
    };

    console.log("片道ピクセル誤差: window.measureOneWayPixelError(lon, lat) を使用可能");
  }, [viewState]);

  const handleFlyTo = useCallback((lat: number, lon: number, zoom: number) => {
    setViewState({
      ...INITIAL_VIEW_STATE,
      longitude: lon,
      latitude: lat,
      zoom: zoom,
      transitionDuration: 2000,
      transitionInterpolator: new FlyToInterpolator(),
    });
  }, []);

  const layers = useMemo(() => generateLayer(item, isMapVisible), [item, isMapVisible]);

  return (
    <div>
      <div className="w-[100%] flex">
        <div className="w-[25%] h-[100vh] flex-col overflow-y-scroll overflow-x-clip">
          <div className="bg-amber-200 flex justify-center p-[1.5%]">
            <h1>オブジェクトたち</h1>
          </div>
          <div className="flex justify-center p-[1.5%]">
            <h1>AfterUnlimitRange,BeforeUnlimitRangeには非対応</h1>
          </div>
          <div>
            {item.map((e) => {
              if (e.isDeleted) return null;

              switch (e.type) {
                case "point":
                  return <Point key={e.id} id={e.id} item={item} setItem={setItem} />;
                case "line":
                  return <Line key={e.id} id={e.id} item={item} setItem={setItem} />;
                case "voxel":
                  return <Voxel key={e.id} id={e.id} item={item} setItem={setItem} onFlyTo={handleFlyTo} />;
                default:
                  return null;
              }
            })}
          </div>
          <div className="flex justify-between p-[4%] px-[10%]">
            <button
              className="bg-[#eaeaea] border-1 border-gray-300 rounded-[4px] p-[3%] hover:bg-amber-400 transition duration-300"
              onClick={() => {
                addObject("point");
              }}
            >
              <span className="bg-amber-200">Point</span>を追加
            </button>
            <button
              className="bg-[#eaeaea] border-1 border-gray-300 rounded-[4px] p-[3%] hover:bg-blue-400 transition duration-300"
              onClick={() => {
                addObject("line");
              }}
            >
              <span className="bg-blue-200">Line</span>を追加
            </button>
            <button
              className="bg-[#eaeaea] border-1 border-gray-300 rounded-[4px] p-[3%] hover:bg-green-400 transition duration-300"
              onClick={() => {
                addObject("voxel");
              }}
            >
              <span className="bg-green-200">Voxel</span>を追加
            </button>
          </div>
        </div>
        <div className="w-[75%] h-[100vh] relative">
          <button
            className="absolute top-4 right-4 z-10 bg-white border-2 border-gray-300 rounded-[4px] px-4 py-2 hover:bg-gray-100 transition duration-300 shadow-md"
            onClick={() => setIsMapVisible(!isMapVisible)}
          >
            {isMapVisible ? "地図を非表示" : "地図を表示"}
          </button>
          <DeckGL
            viewState={viewState}
            onViewStateChange={onViewStateChange}
            views={new MapView({ id: "map", repeat: false })}
            controller={{ maxZoom: 30 }}
            width="100%"
            height="100%"
            layers={layers}
            getTooltip={({ object }) =>
              object && {
                text: `${object.voxelID}`,
              }
            }
          />
        </div>
      </div>
    </div>
  );
}
