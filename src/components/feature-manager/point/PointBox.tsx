import { IconTarget, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import type { Point } from "../../../types/geometry/point";
import styles from "./PointBox.module.css";

type PointBoxProps = {
  point: Point;
  onUpdate: (id: string, updates: Partial<Point>) => void;
  onDelete: (id: string) => void;
};

/**
 * 緯度・経度・高度の入力欄と、削除・フォーカス・カラーの操作ボタンを持つボックス一つのセット
 */
export default function PointBox({ point, onUpdate, onDelete }: PointBoxProps) {
  const [latText, setLatText] = useState(point.latitude.toString());
  const [lngText, setLngText] = useState(point.longitude.toString());
  const [altText, setAltText] = useState(point.altitude.toString());

  useEffect(() => {
    point.id;
    setLatText(point.latitude.toString());
    setLngText(point.longitude.toString());
    setAltText(point.altitude.toString());
  }, [point.id, point.latitude, point.longitude, point.altitude]);

  const color = point.color ?? { r: 15, g: 118, b: 110, a: 255 };

  return (
    <div className={styles.itemBox}>
      <div className={styles.inputBox}>
        <div className={styles.inputElement}>
          <label htmlFor={`lat-input-${point.id}`} className={styles.inputLabel}>
            緯度
          </label>
          <input
            id={`lat-input-${point.id}`}
            type="number"
            className={styles.inputField}
            value={latText}
            step="any"
            min={-90}
            max={90}
            onChange={(e) => setLatText(e.target.value)}
            onBlur={() => {
              const num = parseFloat(latText) || 0;
              setLatText(num.toString());
              onUpdate(point.id, { latitude: num });
            }}
          />
        </div>

        <div className={styles.inputElement}>
          <label htmlFor={`lng-input-${point.id}`} className={styles.inputLabel}>
            経度
          </label>
          <input
            id={`lng-input-${point.id}`}
            type="number"
            className={styles.inputField}
            value={lngText}
            step="any"
            min={-180}
            max={180}
            onChange={(e) => setLngText(e.target.value)}
            onBlur={() => {
              const num = parseFloat(lngText) || 0;
              setLngText(num.toString());
              onUpdate(point.id, { longitude: num });
            }}
          />
        </div>

        <div className={styles.inputElement}>
          <label htmlFor={`alt-input-${point.id}`} className={styles.inputLabel}>
            高度
          </label>
          <input
            id={`alt-input-${point.id}`}
            type="number"
            className={styles.inputField}
            value={altText}
            step="any"
            min={0}
            onChange={(e) => setAltText(e.target.value)}
            onBlur={() => {
              const num = Math.max(0, parseFloat(altText) || 0);
              setAltText(num.toString());
              onUpdate(point.id, { altitude: num });
            }}
          />
        </div>
      </div>

      <div className={styles.actionGroup}>
        <button
          type="button"
          onClick={() => onDelete(point.id)}
          className={`${styles.iconButton} ${styles.deleteButton}`}
          aria-label="点を削除"
        >
          <IconTrash size={16} />
        </button>

        <button
          type="button"
          className={styles.iconButton}
          aria-label="点に移動"
        >
          <IconTarget size={16} />
        </button>

        <div
          className={styles.colorSwatch}
          style={{
            backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${(color.a ?? 255) / 255})`,
          }}
        />
      </div>
    </div>
  );
}
