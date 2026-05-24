import FeatureToolbar from "./FeatureToolbar";
import { useFeatureManagerStore } from "./featureManagerStores";
import { PointPanel } from "./point";

/**
 * 左上のツールバーと、その下で切り替わるパネルを管理する
 */
export default function FeatureManager() {
  const activeMode = useFeatureManagerStore((state) => state.activeMode);

  return (
    <div>
      <FeatureToolbar />
      {activeMode === "point" && <PointPanel />}
    </div>
  );
}
