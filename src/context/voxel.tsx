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
import type { VoxelDefinition } from "../data/voxel-definition";
import hyperVoxelParse from "../utils/parse-spatiotemporal-id";

// ==========================================
// 1. 型定義（倉庫の中身のルールと初期値）
// ==========================================

type RGBA = [number, number, number, number];

type VoxelContextType = {
  voxelItems: Item<"voxel">[];
  addVoxel: (data?: {
    color: RGBA;
    opacity: number;
    voxel: VoxelDefinition[];
    source?: "manual" | "json";
    keys?: string[];
  }) => number;
  deleteVoxel: (id: number) => void;
  updateVoxelString: (id: number, newVoxelString: string) => void;
  updateVoxelColor: (id: number, color: RGBA) => void;
  focusVoxel: (id: number) => void;
  focusOnVoxelDefs: (voxelDefs: VoxelDefinition[]) => void;
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

// 空のクラウド倉庫を作成
const VoxelContext = createContext<VoxelContextType | undefined>(undefined);

type VoxelProviderProps = {
  children: ReactNode;
  onFlyTo: (lon: number, lat: number, zoom?: number, pitch?: number) => void;
  onTimeJump: (time: number) => void;
};

// 初期表示されるサンプルの時空間ID
const DEFAULT_VOXEL_STRING =
  "20/0/931078/413136,21/0/1862158/826272,22/0/3724318/1652544,23/0/7448638/3305088,24/0/14897278/6610176,25/0/29794558/13220352";

// ==========================================
// 2. 大ボス本体（Providerコンポーネント）
// ==========================================

export const VoxelProvider = ({
  children,
  onFlyTo,
  onTimeJump,
}: VoxelProviderProps) => {

  // --- 状態管理（ホワイトボード） ---
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
        voxel: hyperVoxelParse(DEFAULT_VOXEL_STRING),
        voxelString: DEFAULT_VOXEL_STRING,
      },
    },
  ]);
  const [nextVoxelId, setNextVoxelId] = useState(1001);

  // 補助機能用のマップ
  const [voxelColorOverrides, setVoxelColorOverrides] = useState<globalThis.Map<string, RGBA>>(new globalThis.Map());
  const [valueColorMaps, setValueColorMaps] = useState<globalThis.Map<string, globalThis.Map<string, RGBA>>>(new globalThis.Map());
  const [tooltipMap, setTooltipMap] = useState<globalThis.Map<string, string>>(new globalThis.Map());


  // --- アクション機能（魔法のペン） ---

  /**
   * 追加：新しいボクセルをリストに追加する
   */
  const addVoxel = useCallback(
    (data?: {
      color: RGBA;
      opacity: number;
      voxel: VoxelDefinition[];
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
   * 削除：ボクセルをリストから削除し、関連データも消す
   */
  const deleteVoxel = useCallback(
    (id: number) => {
      const targetItem = voxelItems.find((i) => i.id === id);
      // 付属データ（ツールチップや色上書き設定等）のお片付け
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
      // リスト自体からの削除
      setVoxelItems((prev) => prev.filter((i) => i.id !== id));
    },
    [voxelItems],
  );

  /**
   * 更新：ボクセルの時空間ID文字列をパースして中身を上書きする
   */
  const updateVoxelString = useCallback(
    (id: number, newVoxelString: string) => {
      setVoxelItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === id) {
            try {
              const newVoxelData = hyperVoxelParse(newVoxelString);
              return { ...item, data: { ...item.data, voxelString: newVoxelString, voxel: newVoxelData } };
            } catch (_e) {
              return { ...item, data: { ...item.data, voxelString: newVoxelString, voxel: [] } };
            }
          }
          return item;
        }),
      );
    },
    [],
  );

  /**
   * 更新：ボクセルの基本色を上書きする
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
   * 補助：ツールチップ（吹き出し）辞書に新しい単語を登録する
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
   * カメラ操作：指定したボクセル群が画面中心に来るようにカメラを飛ばす
   */
  const focusOnVoxelDefs = useCallback(
    (voxelDefs: VoxelDefinition[]) => {
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
   * カメラ操作：指定したIDのボクセルブロックへカメラを飛ばす
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

  // --- 初期設定（useEffect） ---

  // 初回起動時に、一番最初のサンプルボクセルにカメラをフォーカスさせる
  useEffect(() => {
    focusOnVoxelDefs(hyperVoxelParse(DEFAULT_VOXEL_STRING));
  }, []);


  // --- 倉庫への格納設定 ---

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

// ==========================================
// 3. 直通電話（外部呼び出し用カスタムフック）
// ==========================================
export const useVoxel = () => {
  const context = useContext(VoxelContext);
  if (!context) throw new Error("useVoxel must be used within a VoxelProvider");
  return context;
};
