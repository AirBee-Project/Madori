import {
  IconCube,
  IconFileDescription,
  IconLine,
  IconPoint,
} from "@tabler/icons-react";
import FeatureButton from "./FeatureButton";
import toolbarStyles from "./FeatureToolbar.module.scss";
import { useFeatureManagerStore } from "./featureManagerStore";
import { JsonPanel } from "./json";
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
      </div>
      {activeMode === "spatial" && <SpatialIdPanel />}
      {activeMode === "json" && <JsonPanel />}
      {activeMode === "point" && <PointPanel />}
      {activeMode === "line" && <LinePanel />}
    </div>
  );
}
