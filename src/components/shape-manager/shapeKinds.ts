import {
  IconLine,
  IconPoint,
  IconTopologyStar3,
  type TablerIcon,
} from "@tabler/icons-react";
import type { ComponentType } from "react";
import { pickFile, setFileHandle } from "../../stores/fileHandles";
import { useGraphGroupStore } from "../../stores/graphGroupStores";
import { useLineStore } from "../../stores/lineStores";
import { usePointStore } from "../../stores/pointStores";
import { jsonToGraph } from "../../utils/parser/jsonToGraph";
import GraphList from "./graph/GraphList";
import LineList from "./line/LineList";
import PointList from "./point/PointList";

/**
 * 図形パネルに並ぶ図形の種類。ここに足すと、追加メニューと一覧に出る
 */
export type ShapeKind = {
  name: string;
  icon: TablerIcon;
  /** 失敗したら例外を投げる */
  add: () => void | Promise<void>;
  List: ComponentType;
};

const DEFAULT_COLOR = { r: 15, g: 118, b: 110, a: 255 };

async function addGraphFromFile(): Promise<void> {
  const handle = await pickFile("json");
  if (!handle) return;
  const graph = jsonToGraph(await (await handle.getFile()).text());
  const store = useGraphGroupStore.getState();
  // addGraphGroup は ID を返さないので、追加前後のキーの差分で特定する
  const before = new Set(store.graphGroups.keys());
  const result = store.addGraphGroup({
    name: handle.name,
    nodeColor: DEFAULT_COLOR,
    edgeColor: { r: 100, g: 116, b: 139, a: 200 },
    nodes: graph.nodes,
    adjacency: graph.adjacency,
  });
  if (!result.success) return;
  const after = useGraphGroupStore.getState().graphGroups.keys();
  const id = Array.from(after).find((key) => !before.has(key));
  if (id) setFileHandle(id, handle);
}

export const SHAPE_KINDS: ShapeKind[] = [
  {
    name: "点",
    icon: IconPoint,
    add: () => {
      usePointStore.getState().addPoint({
        latitude: 35.681,
        longitude: 139.767,
        altitude: 0,
        color: DEFAULT_COLOR,
      });
    },
    List: PointList,
  },
  {
    name: "線",
    icon: IconLine,
    add: () => {
      useLineStore.getState().addLine({
        start: { latitude: 35.681, longitude: 139.767, altitude: 0 },
        end: { latitude: 35.691, longitude: 139.787, altitude: 0 },
        color: DEFAULT_COLOR,
        width: 2,
      });
    },
    List: LineList,
  },
  {
    name: "グラフ",
    icon: IconTopologyStar3,
    add: addGraphFromFile,
    List: GraphList,
  },
];
