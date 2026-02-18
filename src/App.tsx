import DeckGL from "@deck.gl/react";
import { useState, useEffect, useCallback } from "react";
import { FlyToInterpolator } from "@deck.gl/core";
import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Item } from "./types/Item";
import Point from "./components/Point";
import Line from "./components/Line";
import Voxel from "./components/Voxel";
import generateLayer from "./utils/GenerateLayer";
import hyperVoxelParse from "./utils/HyperVoxelParse";
import { VoxelDefinition } from "./types/VoxelDefinition";
import TimeAxis from "./components/TimeAxis";
import TimeControls from "./components/TimeControls";
import IdPanel from "./components/IdPanel";
import {
  IconCube,
  IconFileText,
  IconPoint,
  IconLine,
  IconRefresh,
  IconClock,
  IconMap
} from '@tabler/icons-react';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x by default
  const [isIdPanelVisible, setIsIdPanelVisible] = useState(false);

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

    if (v.startTime !== null) {
      setCurrentTime(v.startTime);
    }
  }, []);

  const handleFocus = useCallback((id: number) => {
    const targetItem = item.find((i) => i.id === id);
    if (targetItem && targetItem.type === 'voxel' && targetItem.data.voxel.length > 0) {
      focusOnVoxel(targetItem.data.voxel);
    }
  }, [item, focusOnVoxel]);

  const handleUpdateVoxel = (id: number, newVoxelString: string) => {
    setItem((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id && item.type === 'voxel') {
          try {
            const newVoxelData = hyperVoxelParse(newVoxelString);
            return {
              ...item,
              data: {
                ...item.data,
                voxelString: newVoxelString,
                voxel: newVoxelData,
              },
            };
          } catch (e) {
            return {
              ...item,
              data: {
                ...item.data,
                voxelString: newVoxelString,
                voxel: [],
              },
            };
          }
        }
        return item;
      })
    );
  };

  const handleDeleteVoxel = (id: number) => {
    setItem((prev) => prev.filter(i => i.id !== id));
  };

  const handleColorChange = (id: number) => {
    // Dummy for now
    console.log("Color change requested for", id);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const voxelData = urlParams.get("voxel");
    const colorParam = urlParams.get("color");

    if (voxelData) {
      try {
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

  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp: number = 0;

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;

      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isPlaying) {
        setCurrentTime((prevTime) => prevTime + deltaTime * playbackSpeed);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      lastTimestamp = 0;
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, playbackSpeed]);

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
    <div className="relative w-full h-screen overflow-hidden bg-white">
      {/* Background Map & DeckGL */}
      <div className="absolute inset-0 z-0">
        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState }: any) => setViewState(viewState)}
          controller={{ maxZoom: 25 } as any}
          width="100%"
          height="100%"
          layers={generateLayer(item, isMapVisible, compileMode, currentTime)}
          getTooltip={({ object }) =>
            object && {
              text: `${object.voxelID} `,
            }
          }
        >
          {isMapVisible && (
            <Map
              mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
              renderWorldCopies={false}
            />
          )}
        </DeckGL>
      </div>

      {/* Top Left Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex gap-3">
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-md text-sm font-bold transition ${isIdPanelVisible ? 'bg-white text-[#0F766E]' : 'bg-white hover:bg-gray-50'}`}
          onClick={() => setIsIdPanelVisible(!isIdPanelVisible)}
        >
          <IconCube size={16} /> ID
        </button>
        <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md text-sm font-bold hover:bg-gray-50 transition">
          <IconFileText size={16} /> JSON
        </button>
        <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md text-sm font-bold hover:bg-gray-50 transition">
          <IconPoint size={16} /> 点
        </button>
        <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md text-sm font-bold hover:bg-gray-50 transition">
          <IconLine size={16} /> 直線
        </button>
      </div>

      {/* ID Panel */}
      {isIdPanelVisible && (
        <IdPanel
          items={item}
          onAdd={() => addObject('voxel')}
          onDelete={handleDeleteVoxel}
          onFocus={handleFocus}
          onUpdate={handleUpdateVoxel}
          onColorChange={handleColorChange}
        />
      )}

      {/* Bottom Right Tools */}
      <div className="absolute bottom-24 right-4 z-10 flex flex-col gap-3">
        <button
          className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition"
          onClick={() => setCompileMode(!compileMode)}
          title="Toggle Compile Mode"
        >
          <IconRefresh size={20} />
        </button>
        <button className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition">
          <IconClock size={20} />
        </button>
        <button
          className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition"
          onClick={() => setIsMapVisible(!isMapVisible)}
          title="Toggle Map"
        >
          <IconMap size={20} />
        </button>
      </div>

      {/* Time Controls and Axis (Footer) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm border-t border-gray-200">
        <div className="relative w-full p-2 py-4">
          {/* Timestamp Display */}
          <div className="absolute top-2 left-6 text-sm font-bold text-gray-800">
            {new Date(currentTime * 1000).toLocaleString()}
          </div>

          {/* Controls */}
          <div className="flex justify-center mb-2">
            <TimeControls
              isPlaying={isPlaying}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              speed={playbackSpeed}
              onSpeedChange={setPlaybackSpeed}
            />
          </div>

          {/* Timeline */}
          <TimeAxis
            currentTime={currentTime}
            onTimeChange={setCurrentTime}
          />
        </div>
      </div>

      {/* Hidden Item Rendering logic */}
      <div className="hidden">
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

    </div>
  );
}
