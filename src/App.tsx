import DeckGL from "@deck.gl/react";
import { useState, useRef } from "react";
import { Item } from "./types/Item";
import Point from "./components/Point";
import Line from "./components/Line";
import Voxel from "./components/Voxel";
import Tiles3D from "./components/Tiles3D";
import generateLayer from "./utils/generateLayer";

const INITIAL_VIEW_STATE = {
  longitude: 139.6917,
  latitude: 35.6895,
  zoom: 15,
  pitch: 60,
  bearing: 0,
};

export default function App() {
  const [item, setItem] = useState<Item[]>([]);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const deckRef = useRef<any>(null);

  function addObject(type: "point" | "line" | "voxel" | "tiles3d") {
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
          : type === "voxel"
          ? {
              color: "#0000FF",
              opacity: 30,
              voxel: [],
            }
          : {
              color: "#800080",
              opacity: 80,
              url: "",
            },
    };
    setItem([...item, newObject]);
  }

  function focusOnObject(itemToFocus: Item) {
    if (itemToFocus.type === "point") {
      const pointData = itemToFocus.data as Item<"point">["data"];
      setViewState({
        ...viewState,
        longitude: pointData.lon,
        latitude: pointData.lat,
        zoom: 18,
      });
    } else if (itemToFocus.type === "line") {
      const lineData = itemToFocus.data as Item<"line">["data"];
      const centerLon = (lineData.lon1 + lineData.lon2) / 2;
      const centerLat = (lineData.lat1 + lineData.lat2) / 2;
      setViewState({
        ...viewState,
        longitude: centerLon,
        latitude: centerLat,
        zoom: 16,
      });
    } else if (itemToFocus.type === "voxel") {
      // For voxel, we could calculate center based on voxel data, but for now use default focus
      setViewState({
        ...viewState,
        zoom: 15,
      });
    } else if (itemToFocus.type === "tiles3d") {
      // For 3D Tiles, focus on a general area - could be improved with tileset bounds
      setViewState({
        ...viewState,
        zoom: 14,
      });
    }
  }

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
              switch (e.type) {
                case "point":
                  return <Point key={e.id} id={e.id} item={item} setItem={setItem} onFocus={focusOnObject} />;
                case "line":
                  return <Line key={e.id} id={e.id} item={item} setItem={setItem} onFocus={focusOnObject} />;
                case "voxel":
                  return <Voxel key={e.id} id={e.id} item={item} setItem={setItem} onFocus={focusOnObject} />;
                case "tiles3d":
                  return <Tiles3D key={e.id} id={e.id} item={item} setItem={setItem} onFocus={focusOnObject} />;
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
          <div className="flex justify-center p-[4%] px-[10%]">
            <button
              className="bg-[#eaeaea] border-1 border-gray-300 rounded-[4px] p-[3%] hover:bg-purple-400 transition duration-300"
              onClick={() => {
                addObject("tiles3d");
              }}
            >
              <span className="bg-purple-200">3D Tiles</span>を追加
            </button>
          </div>
        </div>
        <div className="w-[75%] h-[100vh] relative">
          <DeckGL
            ref={deckRef}
            viewState={viewState}
            onViewStateChange={({ viewState }) => setViewState(viewState)}
            controller
            width="75vw"
            layers={generateLayer(item)}
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
