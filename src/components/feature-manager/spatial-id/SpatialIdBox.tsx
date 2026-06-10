import type React from "react";
import { useState, useEffect } from "react";
import { IconTrash, IconTarget } from "@tabler/icons-react";
import type { SpatialIdGroup } from "../../../types/geometry/spatioTemporalId/spatialIdGroup";
import type { SpatialId } from "../../../types/geometry/spatioTemporalId";
import FeatureItemBox from "../common-ui/FeatureItemBox";
import IconButton from "../common-ui/IconButton";
import ColorButton from "../common-ui/ColorButton";
import { stringToSpatialIds } from "../../../utils/parser/stringToSpatialIds";
import styles from "./SpatialIdBox.module.scss";

type SpatialIdBoxProps = {
  group: SpatialIdGroup;
  onUpdate: (id: string, updates: Partial<SpatialIdGroup>) => void;
  onDelete: (id: string) => void;
};

function spatialIdToString(spatialId: SpatialId): string {
  const serializeVal = (val: number | [number, number]): string => {
    return typeof val === "number" ? String(val) : `${val[0]}:${val[1]}`;
  };
  const fStr = serializeVal(spatialId.f);
  const xStr = serializeVal(spatialId.x);
  const yStr = serializeVal(spatialId.y);
  const spatialStr = `${spatialId.z}/${fStr}/${xStr}/${yStr}`;

  if (!spatialId.temporalId) {
    return spatialStr;
  }
  const tStr = serializeVal(spatialId.temporalId.t);
  return `${spatialStr}_${spatialId.temporalId.i}/${tStr}`;
}

export default function SpatialIdBox({
  group,
  onUpdate,
  onDelete,
}: SpatialIdBoxProps) {
  const [text, setText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const joined = group.spatialIds.map(spatialIdToString).join(", ");
    setText(joined);
    setErrorMsg(null);
  }, [group.spatialIds]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    if (val.trim() === "") {
      onUpdate(group.id, { spatialIds: [] });
      setErrorMsg(null);
      return;
    }

    const parsed = stringToSpatialIds(val);
    if (parsed.errors.length > 0) {
      setErrorMsg(`${parsed.errors[0].content}: ${parsed.errors[0].message}`);
    } else {
      setErrorMsg(null);
      onUpdate(group.id, { spatialIds: parsed.success });
    }
  };

  const color = group.color ?? { r: 15, g: 118, b: 110, a: 255 };

  return (
    <FeatureItemBox
      actions={
        <>
          <IconButton
            onClick={() => onDelete(group.id)}
            ariaLabel="空間IDグループを削除"
            variant="danger"
          >
            <IconTrash />
          </IconButton>

          <IconButton onClick={() => {}} ariaLabel="空間IDに移動">
            <IconTarget />
          </IconButton>

          <ColorButton color={color} ariaLabel="色を変更" onClick={() => {}} />
        </>
      }
    >
      <div className={styles.textareaWrapper}>
        <textarea
          id={`spatial-id-input-${group.id}`}
          className={`${styles.textarea} ${errorMsg ? styles.textareaError : ""}`}
          value={text}
          onChange={handleChange}
          rows={3}
        />
        {errorMsg && (
          <div className={styles.errorMessage} role="alert">
            {errorMsg}
          </div>
        )}
      </div>
    </FeatureItemBox>
  );
}
