
import DeckGL from "@deck.gl/react";
import { useState, useEffect, useCallback } from "react";
import { FlyToInterpolator } from "@deck.gl/core";
import { Item } from "./types/Item";
import Point from "./components/Point";
import Line from "./components/Line";
import Voxel from "./components/Voxel";
import generateLayer from "./utils/GenerateLayer";
import hyperVoxelParse from "./utils/HyperVoxelParse";
import { VoxelDefinition } from "./types/VoxelDefinition";

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 0,
  zoom: 1,
  pitch: 0,
  bearing: 0,
};

export default function App() {
  const [item, setItem] = useState<Item[]>([]);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [compileMode, setCompileMode] = useState(true);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [currentTime, setCurrentTime] = useState(0);

  const focusOnVoxel = useCallback((voxelDefs: VoxelDefinition[]) => {
    if (voxelDefs.length === 0) return;

    const v = voxelDefs[0];
    const n = 2 ** v.Z;
    const lonPerTile = 360 / n;

    const xMin = typeof v.X === "number" ? v.X : v.X[0];
    const xMax = typeof v.X === "number" ? v.X : v.X[1];
    const yMin = typeof v.Y === "number" ? v.Y : v.Y[0];
    const yMax = typeof v.Y === "number" ? v.Y : v.Y[1];

    const centerLon = -180 + lonPerTile * ((xMin + xMax + 1) / 2);
    const yCenter = (yMin + yMax + 1) / 2;
    const centerLat =
      (Math.atan(Math.sinh(Math.PI - (yCenter / n) * 2 * Math.PI)) * 180) /
      Math.PI;

    setViewState({
      longitude: centerLon,
      latitude: centerLat,
      zoom: 20,
      pitch: 45,
      bearing: 0,
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator(),
    } as any);
  }, []);

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
          color = "#" + colorParam;
        }

        const newVoxel: Item = {
          id: 1,
          type: "voxel",
          isDeleted: false,
          isVisible: false,
          data: {
            color: color,
            opacity: 30,
            voxel: hyperVoxelParse(voxelData),
            voxelString: voxelData,
          },
        };
        setItem([newVoxel]);
      } catch (error) {
        console.error("Failed to parse voxel data from URL parameters:", error);
      }
    }
  }, []);

  function addObject(type: "point" | "line" | "voxel") {
    let newObject: Item = {
      id: item.length + 1,
      type: type,
      isDeleted: false,
      isVisible: false,
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
            },
    };
    setItem([...item, newObject]);
  }

  return (
    <div>
      <div className="w-[100%] flex">
        <div className="w-[25%] h-[100vh] flex-col overflow-y-scroll overflow-x-clip">
          <div className="bg-amber-200 flex justify-center p-[1.5%]">
            <h1>オブジェクトたち</h1>
          </div>
          <div className="flex justify-center p-[1.5%]">
          </div>
          <div className="px-[6%] mb-[2%]">
            <input
              type="range"
              min={0}
              max={86400}
              step={1}
              value={currentTime}
              onChange={(e) => setCurrentTime(Number(e.target.value))}
              className="w-[100%]"
            />
            <p className="text-sm text-center">{currentTime} 秒</p>
          </div>
          <div>
            {item.map((e) => {
              switch (e.type) {
                case "point":
                  return <Point id={e.id} item={item} setItem={setItem} />;
                case "line":
                  return <Line id={e.id} item={item} setItem={setItem} />;
                case "voxel":
                  return <Voxel id={e.id} item={item} setItem={setItem} onFocus={focusOnVoxel} />;
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
          <button
            className="absolute top-16 right-4 z-10 bg-white border-2 border-gray-300 rounded-[4px] px-4 py-2 hover:bg-gray-100 transition duration-300 shadow-md"
            onClick={() => setCompileMode(!compileMode)}
          >
            {compileMode ? "個別描画に切替" : "統合描画に切替"}
          </button>
          <DeckGL
            viewState={viewState}
            onViewStateChange={({ viewState }: any) => setViewState(viewState)}
            controller={{ maxZoom: 25 } as any}
            width="75vw"
            layers={generateLayer(item, isMapVisible, compileMode, currentTime)}
            getTooltip={({ object }) =>
              object && {
                text: `${object.voxelID} `,
              }
            }
          />
        </div>
      </div>
    </div>
  );
}
