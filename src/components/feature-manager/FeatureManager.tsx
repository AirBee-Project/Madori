import { IconTableMinus,
  IconCube,
  IconFileText,
  IconLine,
  IconMap,
  IconPoint,
  IconRefresh,} from "@tabler/icons-react";
import FeatureButton from "./FeatureButton";
import styles from "./FeatureButton.module.css";

/**
 * @description 地図上に点、線、空間IDなどを追加するためのUI。画面左上に表示される。
 */
export default function FeatureManager() {
  return (
    <div className={styles.toolbar}>
      <FeatureButton name={"空間ID"} icon={IconCube} isActive={false} />
      <FeatureButton name={"点"} icon={IconPoint} isActive={false} />
      <FeatureButton name={"線"} icon={IconLine} isActive={false} />
    </div>
  );
}
