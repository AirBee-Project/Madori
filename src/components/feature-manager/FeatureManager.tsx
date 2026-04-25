import { IconTableMinus } from "@tabler/icons-react";
import FeatureButton from "./FeatureButton";

/** 地図上に点、線、空間IDなどを追加するためのUI。
 * 画面左上に表示される。
 */
export default function FeatureManager() {
  return (
    <div>
      neko
      <FeatureButton name={"点"} icon={IconTableMinus} isActive={false} />
    </div>
  );
}
