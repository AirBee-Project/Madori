import DeckGL from "@deck.gl/react";
import { useState } from "react";
import { Item } from "./types/Item";
import Point from "./components/Point";
import Line from "./components/Line";
import Voxel from "./components/Voxel";
import generateLayer from "./utils/GenerateLayer";

const INITIAL_VIEW_STATE = {
  longitude: 139.6917,
  latitude: 35.6895,
  zoom: 15,
  pitch: 60,
  bearing: 0,
};

export default function App() {
  const [item, setItem] = useState<Item[]>([]);

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
            <h1>AfterUnlimitRange,BeforeUnlimitRangeには非対応</h1>
          </div>
          <div>
            {item.map((e) => {
              switch (e.type) {
                case "point":
                  return <Point id={e.id} item={item} setItem={setItem} />;
                case "line":
                  return <Line id={e.id} item={item} setItem={setItem} />;
                case "voxel":
                  return <Voxel id={e.id} item={item} setItem={setItem} />;
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
          <DeckGL
            initialViewState={INITIAL_VIEW_STATE}
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
