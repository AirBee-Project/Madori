import { Item } from "../types/Item";
import { useState } from "react";
import hyperVoxelParse from "../utils/hyperVoxelParse";
type Props = {
  id: number;
  item: Item[];
  setItem: React.Dispatch<React.SetStateAction<Item[]>>;
  onFocus?: (item: Item) => void;
};
export default function Voxel({ id, item, setItem, onFocus }: Props) {
  const [inputVoxel, setInputVoxel] = useState<string>("");
  let myItem = item.find(
    (e): e is Item<"voxel"> => e.id === id && e.type === "voxel"
  )!;
  function updateItem(newItem: Item<"voxel">): void {
    const result = item.map((e) => {
      if (e.id === newItem.id) {
        return newItem;
      }
      return e;
    });
    setItem(result);
  }
  return (
    <div className="m-[1.5vh] p-[3%] border-0 border-blue-400 rounded-[4px] bg-[#ececec]">
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

        <button
          className="bg-blue-500 text-white px-2 py-1 rounded ml-2 hover:bg-blue-600"
          onClick={() => onFocus && onFocus(myItem)}
        >
          📍
        </button>
        <p>ID:{id}</p>
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
