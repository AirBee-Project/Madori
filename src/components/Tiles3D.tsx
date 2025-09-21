import { Item } from "../types/Item";

type Props = {
  id: number;
  item: Item[];
  setItem: React.Dispatch<React.SetStateAction<Item[]>>;
  onFocus?: (item: Item) => void;
};

export default function Tiles3D({ id, item, setItem, onFocus }: Props) {
  let myItem = item.find(
    (e): e is Item<"tiles3d"> => e.id === id && e.type === "tiles3d"
  )!;

  function updateItem(newItem: Item<"tiles3d">): void {
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
        <p className="bg-purple-200 p-[1%]">3D Tiles</p>
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
          min={0}
          max={100}
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
          <p>Tileset URL</p>
          <input
            type="text"
            placeholder="https://example.com/tileset.json"
            value={myItem.data.url}
            onChange={(e) => {
              updateItem({
                ...myItem,
                data: {
                  ...myItem.data,
                  url: e.target.value,
                },
              });
            }}
            className="border-gray-500 border-1 mx-[2%] bg-[#FFFFFF] flex-1"
          />
        </div>
      </div>
    </div>
  );
}