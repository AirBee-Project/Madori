import { IconCube, IconShape, type TablerIcon } from "@tabler/icons-react";
import { useState } from "react";
import { ShapePanel } from "../shape-manager";
import { SpatialIdPanel } from "../spatial-id-manager";
import styles from "./Sidebar.module.scss";

type Tab = "spatial" | "shape";

const TABS: { tab: Tab; name: string; icon: TablerIcon }[] = [
  { tab: "spatial", name: "空間ID", icon: IconCube },
  { tab: "shape", name: "図形", icon: IconShape },
];

/**
 * 左側のパネル。空間IDと図形をタブで切り替える
 */
export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<Tab>("spatial");
  const [collapsed, setCollapsed] = useState(false);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setCollapsed(false);
  };

  const tabs = (
    <div className={styles.tabs} role="tablist">
      {TABS.map(({ tab, name, icon: Icon }) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
          onClick={() => handleTabClick(tab)}
        >
          <Icon size={16} />
          {name}
        </button>
      ))}
    </div>
  );

  const panelProps = {
    title: tabs,
    collapsed,
    onToggleCollapsed: () => setCollapsed((prev) => !prev),
  };

  return (
    <div className={styles.sidebar}>
      {activeTab === "spatial" ? (
        <SpatialIdPanel {...panelProps} />
      ) : (
        <ShapePanel {...panelProps} />
      )}
    </div>
  );
}
