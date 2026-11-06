import { usePointStore } from "../../../stores/pointStores";
import PointBox from "./PointBox";

export default function PointList() {
  const points = usePointStore((state) => state.points);
  const editPoint = usePointStore((state) => state.editPoint);
  const removePoint = usePointStore((state) => state.removePoint);

  if (points.size === 0) return null;
  return (
    <>
      {Array.from(points.values(), (point) => (
        <PointBox
          key={point.id}
          point={point}
          onUpdate={editPoint}
          onDelete={removePoint}
        />
      ))}
    </>
  );
}
