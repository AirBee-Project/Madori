import { useSpatialIdGroupStore } from "../../../stores/spatialIdGroupStores";
import type { SpatialIdGroup } from "../../../types/geometry/spatioTemporalId/spatialIdGroup";
import FooterAddButton from "../common-ui/FooterAddButton";
import CommonPanel from "../common-ui/Panel";
import SpatialIdBox from "./SpatialIdBox";

export default function SpatialIdPanel() {
  const spatialIdGroupsMap = useSpatialIdGroupStore(
    (state) => state.spatialIdGroups,
  );
  const addSpatialIdGroup = useSpatialIdGroupStore(
    (state) => state.addSpatialIdGroup,
  );
  const editSpatialIdGroup = useSpatialIdGroupStore(
    (state) => state.editSpatialIdGroup,
  );
  const removeSpatialIdGroup = useSpatialIdGroupStore(
    (state) => state.removeSpatialIdGroup,
  );

  const groupsList = Array.from(spatialIdGroupsMap.values());

  const handleAdd = () => {
    addSpatialIdGroup({
      color: { r: 15, g: 118, b: 110, a: 255 },
      spatialIds: [],
    });
  };

  const handleUpdate = (id: string, updates: Partial<SpatialIdGroup>) => {
    editSpatialIdGroup(id, updates);
  };

  const handleDelete = (id: string) => {
    removeSpatialIdGroup(id);
  };

  return (
    <CommonPanel
      footerButton={
        <FooterAddButton onClick={handleAdd} ariaLabel="IDを追加" />
      }
    >
      {groupsList.map((group) => (
        <SpatialIdBox
          key={group.id}
          group={group}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}
    </CommonPanel>
  );
}
