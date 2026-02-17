import { Item } from "../types/Item";
import { useState, useEffect } from "react";
import hyperVoxelParse from "../utils/HyperVoxelParse";
import { VoxelDefinition } from "../types/VoxelDefinition";
type Props = {
  id: number;
  item: Item[];
  setItem: React.Dispatch<React.SetStateAction<Item[]>>;
  onFocus: (voxelDefs: VoxelDefinition[]) => void;
};
export default function Voxel({ id, item, setItem, onFocus }: Props) {
  const [inputVoxel, setInputVoxel] = useState<string>("");
  let myItem = item.find(
    (e): e is Item<"voxel"> => e.id === id && e.type === "voxel"
  )!;

  // Initialize inputVoxel from voxelString if available
  useEffect(() => {
    if (myItem.data.voxelString && !inputVoxel) {
      setInputVoxel(myItem.data.voxelString);
    }
  }, [myItem.data.voxelString]);
  function updateItem(newItem: Item<"voxel">): void {
    const result = item.map((e) => {
      if (e.id === newItem.id) {
        return newItem;
      }
      return e;
    });
    setItem(result);
  }
  function deleteItem(): void {
    setItem(item.filter((e) => e.id !== id));
  }
  return (
    <div className="m-[1.5vh] p-[3%] border-0 border-blue-400 rounded-[4px] bg-[#ececec]">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <p className="bg-green-200 p-[1%]">Voxel</p>
          <input
            type="text"
            placeholder="色"
            value={myItem.data.color}
            onChange={(e) => {
              updateItem({
                ...myItem,
                data: {
                  ...myItem.data,
                  color: e.target.value,
                },
              });
            }}
            className="w-[20%] border-gray-500 border-1 mx-[2%] bg-[#FFFFFF]"
          />
          <input
            type="number"
            placeholder="不透明度"
            value={myItem.data.opacity}
            onChange={(e) => {
              updateItem({
                ...myItem,
                data: {
                  ...myItem.data,
                  opacity: parseFloat(e.target.value),
                },
              });
            }}
            className="w-[20%] border-gray-500 border-1 mx-[2%] bg-[#FFFFFF]"
          />

          <p>ID:{id}</p>
        </div>
        <button
          onClick={() => onFocus(myItem.data.voxel)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition duration-300 mr-2"
        >
          Focus
        </button>
        <button
          onClick={deleteItem}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition duration-300"
        >
          削除
        </button>
      </div>
      <div>
        <div className="flex mt-[2%]">
          <input
            type="text"
            placeholder="{z}/{f}/{x}/{y}"
            value={inputVoxel}
            onChange={(e) => {
              setInputVoxel(e.target.value);
              updateItem({
                ...myItem,
                data: {
                  ...myItem.data,
                  voxel: hyperVoxelParse(e.target.value),
                  voxelString: e.target.value,
                },
              });
            }}
            className="border-gray-500 border-1 bg-[#FFFFFF] w-[100%] h-[100px] align-top"
          />
        </div>
      </div>
    </div>
  );
}
