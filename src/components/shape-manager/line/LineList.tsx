import { useLineStore } from "../../../stores/lineStores";
import LineBox from "./LineBox";

export default function LineList() {
  const lines = useLineStore((state) => state.lines);
  const editLine = useLineStore((state) => state.editLine);
  const removeLine = useLineStore((state) => state.removeLine);

  if (lines.size === 0) return null;
  return (
    <>
      {Array.from(lines.values(), (line) => (
        <LineBox
          key={line.id}
          line={line}
          onUpdate={editLine}
          onDelete={removeLine}
        />
      ))}
    </>
  );
}
