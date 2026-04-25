import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Item } from "../data/item";
import type { IdDefinition } from "../data/id-definition";
import parseSpatiotemporalId from "../utils/parse-spatiotemporal-id";

type RGBA = [number, number, number, number];

type VoxelContextType = {
  voxelItems: Item<"voxel">[];
  addVoxel: (data?: {
    color: RGBA;
    opacity: number;
    voxel: IdDefinition[];
    source?: "manual" | "json";
    keys?: string[];
  }) => number;
  deleteVoxel: (id: number) => void;
  updateVoxelString: (id: number, newVoxelString: string) => void;
  updateVoxelColor: (id: number, color: RGBA) => void;
  focusVoxel: (id: number) => void;
  focusOnVoxelDefs: (voxelDefs: IdDefinition[]) => void;
  addTooltips: (newTooltips: Map<string, string>) => void;
  voxelColorOverrides: globalThis.Map<string, RGBA>;
  setVoxelColorOverrides: React.Dispatch<
    React.SetStateAction<globalThis.Map<string, RGBA>>
  >;
  valueColorMaps: globalThis.Map<string, globalThis.Map<string, RGBA>>;
  setValueColorMaps: React.Dispatch<
    React.SetStateAction<globalThis.Map<string, globalThis.Map<string, RGBA>>>
  >;
  tooltipMap: globalThis.Map<string, string>;
  setTooltipMap: React.Dispatch<
    React.SetStateAction<globalThis.Map<string, string>>
  >;
};

/**
 * ボクセル倉庫のコンテキスト
 */
const VoxelContext = createContext<VoxelContextType | undefined>(undefined);

type VoxelProviderProps = {
  children: ReactNode;
  onFlyTo: (lon: number, lat: number, zoom?: number, pitch?: number) => void;
  onTimeJump: (time: number) => void;
};

// 初期表示される時空間ID
const DEFAULT_VOXEL_STRING =
  "20/0/931078/413136,21/0/1862158/826272,22/0/3724318/1652544,23/0/7448638/3305088,24/0/14897278/6610176,25/0/29794558/13220352";

/**
 * ボクセル倉庫のプロバイダー
 */
export const VoxelProvider = ({
  children,
  onFlyTo,
  onTimeJump,
}: VoxelProviderProps) => {
  const [voxelItems, setVoxelItems] = useState<Item<"voxel">[]>([
    {
      id: 1000,
      type: "voxel",
      source: "manual",
      isDeleted: false,
      isVisible: false,
      data: {
        color: [0, 0, 255, 76],
        opacity: 30,
        voxel: parseSpatiotemporalId(DEFAULT_VOXEL_STRING),
        voxelString: DEFAULT_VOXEL_STRING,
      },
    },
  ]);
  const [nextVoxelId, setNextVoxelId] = useState(1001);

  const [voxelColorOverrides, setVoxelColorOverrides] = useState<
    globalThis.Map<string, RGBA>
  >(new globalThis.Map());
  const [valueColorMaps, setValueColorMaps] = useState<
    globalThis.Map<string, globalThis.Map<string, RGBA>>
  >(new globalThis.Map());
  const [tooltipMap, setTooltipMap] = useState<globalThis.Map<string, string>>(
    new globalThis.Map(),
  );

  /**
   * 新しいボクセルをリストに追加する関数
   */
  const addVoxel = useCallback(
    (data?: {
      color: RGBA;
      opacity: number;
      voxel: IdDefinition[];
      source?: "manual" | "json";
      keys?: string[];
    }): number => {
      const id = nextVoxelId;
      setNextVoxelId((prev) => prev + 1);
      const newItem: Item<"voxel"> = {
        id,
        type: "voxel",
        source: data?.source ?? "manual",
        isDeleted: false,
        isVisible: false,
        data: data
          ? {
              color: data.color,
              opacity: data.opacity,
              voxel: data.voxel,
              keys: data.keys,
            }
          : { color: [0, 0, 255, 76], opacity: 30, voxel: [] },
      };
      setVoxelItems((prev) => [...prev, newItem]);
      return id;
    },
    [nextVoxelId],
  );

  /**
   * ボクセルの削除関数
   */
  const deleteVoxel = useCallback(
    (id: number) => {
      const targetItem = voxelItems.find((i) => i.id === id);
      if (targetItem?.data.keys?.length) {
        const keysToRemove = targetItem.data.keys;

        setTooltipMap((prev) => {
          const next = new globalThis.Map(prev);
          let changed = false;
          for (const key of keysToRemove) {
            if (next.delete(key)) changed = true;
          }
          return changed ? next : prev;
        });

        setVoxelColorOverrides((prev) => {
          const next = new globalThis.Map(prev);
          let changed = false;
          for (const key of keysToRemove) {
            if (next.delete(key)) changed = true;
          }
          return changed ? next : prev;
        });
      }
      setVoxelItems((prev) => prev.filter((i) => i.id !== id));
    },
    [voxelItems],
  );

  /**
   * ボクセルの時空間ID文字列をパースして中身を上書きする関数
   */
  const updateVoxelString = useCallback(
    (id: number, newVoxelString: string) => {
      setVoxelItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === id) {
            try {
              const newVoxelData = parseSpatiotemporalId(newVoxelString);
              return {
                ...item,
                data: {
                  ...item.data,
                  voxelString: newVoxelString,
                  voxel: newVoxelData,
                },
              };
            } catch (_e) {
              return {
                ...item,
                data: { ...item.data, voxelString: newVoxelString, voxel: [] },
              };
            }
          }
          return item;
        }),
      );
    },
    [],
  );

  /**
   * ボクセルの基本色を上書きする関数
   */
  const updateVoxelColor = useCallback((id: number, color: RGBA) => {
    setVoxelItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          return { ...item, data: { ...item.data, color } };
        }
        return item;
      }),
    );
  }, []);

  /**
   * ツールチップ辞書に新しい単語を登録する関数
   */
  const addTooltips = useCallback((newTooltips: Map<string, string>) => {
    setTooltipMap((prev) => {
      const merged = new globalThis.Map(prev);
      for (const [key, value] of newTooltips) {
        merged.set(key, value);
      }
      return merged;
    });
  }, []);

  /**
   * ボクセル群の中心座標を計算する関数
   */
  const focusOnVoxelDefs = useCallback(
    (voxelDefs: IdDefinition[]) => {
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

      onFlyTo(centerLon, centerLat);

      if (v.startTime !== null) {
        onTimeJump(v.startTime);
      }
    },
    [onFlyTo, onTimeJump],
  );

  /**
   * 指定したIDのボクセルブロックへカメラを飛ばす関数
   */
  const focusVoxel = useCallback(
    (id: number) => {
      const targetItem = voxelItems.find((i) => i.id === id);
      if (targetItem && targetItem.data.voxel.length > 0) {
        focusOnVoxelDefs(targetItem.data.voxel);
      }
    },
    [voxelItems, focusOnVoxelDefs],
  );

  // 最初にサンプルボクセルにカメラをフォーカスさせる
  useEffect(() => {
    focusOnVoxelDefs(parseSpatiotemporalId(DEFAULT_VOXEL_STRING));
  }, [focusOnVoxelDefs]);

  const contextValue = useMemo(
    () => ({
      voxelItems,
      addVoxel,
      deleteVoxel,
      updateVoxelString,
      updateVoxelColor,
      focusVoxel,
      focusOnVoxelDefs,
      addTooltips,
      voxelColorOverrides,
      setVoxelColorOverrides,
      valueColorMaps,
      setValueColorMaps,
      tooltipMap,
      setTooltipMap,
    }),
    [
      voxelItems,
      addVoxel,
      deleteVoxel,
      updateVoxelString,
      updateVoxelColor,
      focusVoxel,
      focusOnVoxelDefs,
      addTooltips,
      voxelColorOverrides,
      valueColorMaps,
      tooltipMap,
    ],
  );

  return (
    <VoxelContext.Provider value={contextValue}>
      {children}
    </VoxelContext.Provider>
  );
};

export const useVoxel = () => {
  const context = useContext(VoxelContext);
  if (!context) throw new Error("useVoxel must be used within a VoxelProvider");
  return context;
};
