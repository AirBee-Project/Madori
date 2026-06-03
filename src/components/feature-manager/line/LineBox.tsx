import { IconTarget, IconTrash } from "@tabler/icons-react";
import type { Line } from "../../../types/geometry/line";
import IconButton from "../common-ui/IconButton";
import ColorButton from "../common-ui/ColorButton";
import PositionInput from "../common-ui/PositionInput";
import FeatureItemBox from "../common-ui/FeatureItemBox";
import styles from "./LineBox.module.scss";

type LineBoxProps = {
  line: Line;
  onUpdate: (id: string, updates: Partial<Line>) => void;
  onDelete: (id: string) => void;
};

/**
 * 始点・終点の緯度・経度・高度の入力欄と、削除・フォーカス・カラーの操作ボタンを持つボックス一つのセット
 */
export default function LineBox({ line, onUpdate, onDelete }: LineBoxProps) {
  const color = line.color ?? { r: 15, g: 118, b: 110, a: 255 };
  const dotColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;

  return (
    <FeatureItemBox
      actions={
        <>
          <IconButton
            onClick={() => onDelete(line.id)}
            ariaLabel="線を削除"
            variant="danger"
          >
            <IconTrash />
          </IconButton>

          <IconButton
            onClick={() => {
              // todo
            }}
            ariaLabel="線に移動"
          >
            <IconTarget />
          </IconButton>

          <ColorButton
            color={color}
            ariaLabel="色を変更"
            onClick={() => {
              // todo
            }}
          />
        </>
      }
    >
      <div className={styles.lineContent}>
        <div className={styles.pointContainer}>
          <span className={styles.pointLabel}>
            <span
              className={styles.dot}
              style={{ backgroundColor: dotColor }}
            />
            始点
          </span>
          <PositionInput
            id={`${line.id}-start`}
            latitude={line.start.latitude}
            longitude={line.start.longitude}
            altitude={line.start.altitude}
            onChange={(updates) =>
              onUpdate(line.id, { start: { ...line.start, ...updates } })
            }
          />
        </div>

        {/* 始点と終点を結ぶ線 */}
        <div className={styles.connector} />

        <div className={styles.pointContainer}>
          <span className={styles.pointLabel}>
            <span
              className={styles.dot}
              style={{ backgroundColor: dotColor }}
            />
            終点
          </span>
          <PositionInput
            id={`${line.id}-end`}
            latitude={line.end.latitude}
            longitude={line.end.longitude}
            altitude={line.end.altitude}
            onChange={(updates) =>
              onUpdate(line.id, { end: { ...line.end, ...updates } })
            }
          />
        </div>
      </div>
    </FeatureItemBox>
  );
}
