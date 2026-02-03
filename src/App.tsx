import DeckGL from "@deck.gl/react";
import { MapView, FlyToInterpolator } from "deck.gl";
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
