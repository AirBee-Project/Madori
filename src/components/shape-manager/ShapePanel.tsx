import { IconX } from "@tabler/icons-react";
import { useState } from "react";
import FooterAddButton from "../common-ui/FooterAddButton";
import IconButton from "../common-ui/IconButton";
import Panel, { type PanelProps } from "../common-ui/Panel";
import styles from "./ShapePanel.module.scss";
import { SHAPE_KINDS, type ShapeKind } from "./shapeKinds";

type ShapePanelProps = Pick<
  PanelProps,
  "title" | "collapsed" | "onToggleCollapsed"
>;

/**
 * 空間ID以外の図形（点・線・グラフなど）をまとめたパネル
 */
export default function ShapePanel({
  title,
  collapsed,
  onToggleCollapsed,
}: ShapePanelProps) {
  const [isChoosingKind, setIsChoosingKind] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (kind: ShapeKind) => {
    setIsChoosingKind(false);
    setError(null);
    try {
      await kind.add();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || `${kind.name}を追加できませんでした。`);
    }
  };

  return (
    <Panel
      title={title}
      collapsed={collapsed}
      onToggleCollapsed={onToggleCollapsed}
      footer={
        isChoosingKind ? (
          <div className={styles.kindGrid}>
            {SHAPE_KINDS.map((kind) => (
              <button
                key={kind.name}
                type="button"
                className={styles.kindButton}
                onClick={() => handleAdd(kind)}
              >
                <kind.icon size={16} />
                {kind.name}
              </button>
            ))}
            <IconButton
              ariaLabel="追加をやめる"
              onClick={() => setIsChoosingKind(false)}
            >
              <IconX size={16} />
            </IconButton>
          </div>
        ) : (
          <FooterAddButton
            label="図形を追加"
            onClick={() => setIsChoosingKind(true)}
          />
        )
      }
    >
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
      {SHAPE_KINDS.map((kind) => (
        <kind.List key={kind.name} />
      ))}
    </Panel>
  );
}
