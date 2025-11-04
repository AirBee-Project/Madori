import { Item } from "../types/Item";
import { useState } from "react";
import hyperVoxelParse from "../utils/HyperVoxelParse";
type Props = {
  id: number;
  item: Item[];
  setItem: React.Dispatch<React.SetStateAction<Item[]>>;
};
export default function Voxel({ id, item, setItem }: Props) {
  const [inputVoxel, setInputVoxel] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>("");
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
  function deleteItem(): void {
    setItem(item.filter((e) => e.id !== id));
  }

  async function loadFromUrl(): Promise<void> {
    if (!inputUrl.trim()) {
      setLoadError("URLを入力してください");
      return;
    }
    
    setIsLoading(true);
    setLoadError("");
    
    try {
      const response = await fetch(inputUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      
      // Parse the voxel data from the fetched content
      try {
        const parsedVoxels = hyperVoxelParse(text);
        
        // Update the voxel data
        updateItem({
          ...myItem,
          data: {
            ...myItem.data,
            voxel: parsedVoxels,
          },
        });
        
        // Update the input field with the loaded data
        setInputVoxel(text);
        setIsLoading(false);
      } catch (parseError) {
        throw new Error(`データの解析に失敗しました: ${parseError instanceof Error ? parseError.message : '不明なエラー'}`);
      }
    } catch (error) {
      console.error("Failed to load voxel from URL:", error);
      setLoadError(`読み込みエラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
      setIsLoading(false);
    }
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
          onClick={deleteItem}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition duration-300"
        >
          削除
        </button>
      </div>
      <div>
        <div className="flex mt-[2%] mb-[2%] gap-2">
          <input
            type="text"
            placeholder="URL (例: https://example.com/voxels.txt)"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="border-gray-500 border-1 bg-[#FFFFFF] flex-1"
            disabled={isLoading}
          />
          <button
            onClick={loadFromUrl}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-1 rounded transition duration-300"
          >
            {isLoading ? "読み込み中..." : "URLから読み込み"}
          </button>
        </div>
        {loadError && (
          <div className="text-red-500 text-sm mb-[2%]">{loadError}</div>
        )}
        <div className="flex">
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
