import { IconTableMinus } from "@tabler/icons-react";
import FeatureButton from "./FeatureButton";

/**
 * @description 地図上に点、線、空間IDなどを追加するためのUI。画面左上に表示される。
 */
export default function FeatureManager() {
  return (
    <div>
      <FeatureButton name={"点"} icon={IconTableMinus} isActive={false} />
      <FeatureButton name={"点"} icon={IconTableMinus} isActive={false} />
      <FeatureButton name={"点"} icon={IconTableMinus} isActive={false} />
      <FeatureButton name={"点"} icon={IconTableMinus} isActive={false} />
    </div>
  );
}
