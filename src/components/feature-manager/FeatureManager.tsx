import {
  IconCube,
  IconDatabase,
  IconFileDescription,
  IconLine,
  IconPoint,
  IconTopologyStar3,
} from "@tabler/icons-react";
import FeatureButton from "./FeatureButton";
import toolbarStyles from "./FeatureToolbar.module.scss";
import { useFeatureManagerStore } from "./featureManagerStore";
import { GraphPanel } from "./graph";
import { JsonPanel } from "./json";
import { KasanePanel } from "./kasane";
import { LinePanel } from "./line";
import { PointPanel } from "./point";
import { SpatialIdPanel } from "./spatial-id";

/**
 * 左上のツールバーと、その下で切り替わるパネルを管理する
 */
export default function FeatureManager() {
  const activeMode = useFeatureManagerStore((state) => state.activeMode);
  const toggleMode = useFeatureManagerStore((state) => state.toggleMode);

  return (
    <div>
      <div className={toolbarStyles.toolbar}>
        <FeatureButton
          name={"空間ID"}
          icon={IconCube}
          isActive={activeMode === "spatial"}
          onClick={() => toggleMode("spatial")}
        />
        <FeatureButton
          name={"JSON"}
          icon={IconFileDescription}
          isActive={activeMode === "json"}
          onClick={() => toggleMode("json")}
        />
        <FeatureButton
          name={"Kasane"}
          icon={IconDatabase}
          isActive={activeMode === "kasane"}
          onClick={() => toggleMode("kasane")}
        />
        <FeatureButton
          name={"点"}
          icon={IconPoint}
          isActive={activeMode === "point"}
          onClick={() => toggleMode("point")}
        />
        <FeatureButton
          name={"線"}
          icon={IconLine}
          isActive={activeMode === "line"}
          onClick={() => toggleMode("line")}
        />
        <FeatureButton
          name={"グラフ描画"}
          icon={IconTopologyStar3}
          isActive={activeMode === "graph"}
          onClick={() => toggleMode("graph")}
        />
      </div>
      {activeMode === "spatial" && <SpatialIdPanel />}
      {activeMode === "json" && <JsonPanel />}
      {activeMode === "point" && <PointPanel />}
      {activeMode === "line" && <LinePanel />}
      {activeMode === "kasane" && <KasanePanel />}
      {activeMode === "graph" && <GraphPanel />}
    </div>
  );
}
