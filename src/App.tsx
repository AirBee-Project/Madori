import DeckGL from "@deck.gl/react";
import { useState, useEffect, useRef } from "react";
import { Item } from "./types/Item";
import Point from "./components/Point";
import Line from "./components/Line";
import Voxel from "./components/Voxel";
import generateLayer from "./utils/GenerateLayer";
import hyperVoxelParse from "./utils/HyperVoxelParse";

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  transitionDuration?: number;
  transitionInterpolator?: any;
};

const INITIAL_VIEW_STATE: ViewState = {
  longitude: 139.6917,
  latitude: 35.6895,
  zoom: 15,
  pitch: 60,
  bearing: 0,
};

export default function App() {
  const [item, setItem] = useState<Item[]>([]);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const deckRef = useRef<DeckGL>(null);

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

        const newVoxel: Item = {
          id: 1,
          type: "voxel",
          isDeleted: false,
          isVisible: false,
          isFocused: false,
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
      isFocused: false,
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

  function handleFocus(id: number) {
    const focusedItem = item.find((e) => e.id === id);
    if (!focusedItem) return;

    // Unfocus all other items and focus the clicked one
    const updatedItems = item.map((e) => ({
      ...e,
      isFocused: e.id === id,
    }));
    setItem(updatedItems);

    // Calculate target position based on item type
    let targetLongitude = INITIAL_VIEW_STATE.longitude;
    let targetLatitude = INITIAL_VIEW_STATE.latitude;
    let targetZoom = 18;

    if (focusedItem.type === "point") {
      targetLongitude = focusedItem.data.lon;
      targetLatitude = focusedItem.data.lat;
    } else if (focusedItem.type === "line") {
      // Focus on the midpoint of the line
      targetLongitude = (focusedItem.data.lon1 + focusedItem.data.lon2) / 2;
      targetLatitude = (focusedItem.data.lat1 + focusedItem.data.lat2) / 2;
    } else if (focusedItem.type === "voxel" && focusedItem.data.voxel.length > 0) {
      // Focus on the first voxel's center
      const firstVoxel = focusedItem.data.voxel[0];
      if (firstVoxel && firstVoxel.lon !== undefined && firstVoxel.lat !== undefined) {
        targetLongitude = firstVoxel.lon;
        targetLatitude = firstVoxel.lat;
      }
    }

    // Animate camera to the focused object
    setViewState({
      longitude: targetLongitude,
      latitude: targetLatitude,
      zoom: targetZoom,
      pitch: 60,
      bearing: 0,
      transitionDuration: 1000,
    });
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
                  return <Point key={e.id} id={e.id} item={item} setItem={setItem} onFocus={handleFocus} />;
                case "line":
                  return <Line key={e.id} id={e.id} item={item} setItem={setItem} onFocus={handleFocus} />;
                case "voxel":
                  return <Voxel key={e.id} id={e.id} item={item} setItem={setItem} onFocus={handleFocus} />;
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
            ref={deckRef}
            viewState={viewState}
            onViewStateChange={({ viewState }) => setViewState(viewState)}
            controller
            width="75vw"
            layers={generateLayer(item, isMapVisible)}
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
