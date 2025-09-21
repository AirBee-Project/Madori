import { Item } from "../types/Item";
type Props = {
  id: number;
  item: Item[];
  setItem: React.Dispatch<React.SetStateAction<Item[]>>;
  onFocus?: (item: Item) => void;
};
export default function Point({ id, item, setItem, onFocus }: Props) {
  let myItem = item.find(
    (e): e is Item<"point"> => e.id === id && e.type === "point"
  )!;
  function updateItem(newItem: Item<"point">): void {
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
        <p className="bg-amber-200 p-[1%]">Point</p>
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
        <input
          type="number"
          placeholder="サイズ"
          value={myItem.data.size}
          min={0}
          onChange={(e) => {
            updateItem({
              ...myItem,
              data: {
                ...myItem.data,
                size: parseFloat(e.target.value),
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
          <p>経度</p>
          <input
            type="number"
            placeholder="経度"
            value={myItem.data.lon}
            max={180}
            min={-180}
            className="border-gray-500 border-1 mx-[2%] bg-[#FFFFFF]"
            onChange={(e) => {
              updateItem({
                ...myItem,
                data: {
                  ...myItem.data,
                  lon: parseFloat(e.target.value),
                },
              });
            }}
          />
          <p>緯度</p>
          <input
            type="number"
            placeholder="緯度"
            value={myItem.data.lat}
            max={85.0511}
            min={-85.0511}
            className="border-gray-500 border-1 mx-[2%] bg-[#FFFFFF] ml-[3%]"
            onChange={(e) => {
              updateItem({
                ...myItem,
                data: {
                  ...myItem.data,
                  lat: parseFloat(e.target.value),
                },
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
