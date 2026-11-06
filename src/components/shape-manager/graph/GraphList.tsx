import { deleteFileHandle } from "../../../stores/fileHandles";
import { useGraphGroupStore } from "../../../stores/graphGroupStores";
import GraphBox from "./GraphBox";

export default function GraphList() {
  const graphGroups = useGraphGroupStore((state) => state.graphGroups);
  const editGraphGroup = useGraphGroupStore((state) => state.editGraphGroup);
  const removeGraphGroup = useGraphGroupStore(
    (state) => state.removeGraphGroup,
  );

  const handleDelete = (id: string) => {
    deleteFileHandle(id);
    removeGraphGroup(id);
  };

  if (graphGroups.size === 0) return null;
  return (
    <>
      {Array.from(graphGroups.values(), (group) => (
        <GraphBox
          key={group.id}
          group={group}
          onUpdate={editGraphGroup}
          onDelete={handleDelete}
        />
      ))}
    </>
  );
}
