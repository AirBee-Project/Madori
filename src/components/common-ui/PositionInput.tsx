import { useEffect, useState } from "react";
import styles from "./PositionInput.module.scss";

type PositionInputProps = {
  id: string;
  latitude: number;
  longitude: number;
  altitude: number;
  onChange: (updates: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  }) => void;
  disabled?: boolean;
};

/**
 * 緯度・経度・高度の入力欄をまとめた共通コンポーネント
 */
export default function PositionInput({
  id,
  latitude,
  longitude,
  altitude,
  onChange,
  disabled = false,
}: PositionInputProps) {
  const [latText, setLatText] = useState(latitude.toString());
  const [lngText, setLngText] = useState(longitude.toString());
  const [altText, setAltText] = useState(altitude.toString());

  useEffect(() => {
    setLatText(latitude.toString());
  }, [latitude]);
  useEffect(() => {
    setLngText(longitude.toString());
  }, [longitude]);
  useEffect(() => {
    setAltText(altitude.toString());
  }, [altitude]);

  return (
    <div className={styles.inputBox}>
      <div className={styles.inputElement}>
        <label htmlFor={`lat-input-${id}`} className={styles.inputLabel}>
          緯度
        </label>
        <input
          id={`lat-input-${id}`}
          type="number"
          className={styles.inputField}
          value={latText}
          step="any"
          min={-85.0511}
          max={85.0511}
          disabled={disabled}
          onChange={(e) => setLatText(e.target.value)}
          onBlur={() => {
            const num = parseFloat(latText) || 0;
            setLatText(num.toString());
            onChange({ latitude: num });
          }}
        />
      </div>

      <div className={styles.inputElement}>
        <label htmlFor={`lng-input-${id}`} className={styles.inputLabel}>
          経度
        </label>
        <input
          id={`lng-input-${id}`}
          type="number"
          className={styles.inputField}
          value={lngText}
          step="any"
          min={-180}
          max={180}
          disabled={disabled}
          onChange={(e) => setLngText(e.target.value)}
          onBlur={() => {
            const num = parseFloat(lngText) || 0;
            setLngText(num.toString());
            onChange({ longitude: num });
          }}
        />
      </div>

      <div className={styles.inputElement}>
        <label htmlFor={`alt-input-${id}`} className={styles.inputLabel}>
          高度
        </label>
        <input
          id={`alt-input-${id}`}
          type="number"
          className={styles.inputField}
          value={altText}
          step="any"
          min={0}
          disabled={disabled}
          onChange={(e) => setAltText(e.target.value)}
          onBlur={() => {
            const num = Math.max(0, parseFloat(altText) || 0);
            setAltText(num.toString());
            onChange({ altitude: num });
          }}
        />
      </div>
    </div>
  );
}
