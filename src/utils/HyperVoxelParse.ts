import type { VoxelDefinition } from "../types/VoxelDefinition";

export default function hyperVoxelParse(
  voxelsString: string,
): VoxelDefinition[] {
  voxelsString = voxelsString.replace("[", "");
  voxelsString = voxelsString.replace("]", "");
  voxelsString = voxelsString.replace(/'/g, "");
  let voxelStringList: string[] = voxelsString
    .split(",")
    .filter((v) => v.trim() !== "");
  let result: VoxelDefinition[] = [];

  if (voxelStringList.length === 0) {
    return result;
  }

  for (let i = 0; i < voxelStringList.length; i++) {
    if (!voxelStringList[i] || voxelStringList[i].trim() === "") continue;

    let spatialPart = voxelStringList[i].trim();
    let timePart: string | null = null;

    const underscoreIndex = spatialPart.indexOf("_");
    if (underscoreIndex !== -1) {
      timePart = spatialPart.substring(underscoreIndex + 1);
      spatialPart = spatialPart.substring(0, underscoreIndex);
    }

    let voxelParseList = spatialPart.split("/");
    let zValue: number = Number(voxelParseList[0]);

    const { startTime, endTime } = parseTimePart(timePart);

    let resultVoxel: VoxelDefinition = {
      Z: zValue,
      F: parseDimensionRange(zValue, "F", voxelParseList[1]),
      X: parseDimensionRange(zValue, "X", voxelParseList[2]),
      Y: parseDimensionRange(zValue, "Y", voxelParseList[3]),
      startTime,
      endTime,
    };
    result.push(resultVoxel);
  }

  return result;
}

function parseDimensionRange(
  zoomLevel: number,
  dimension: "X" | "Y" | "F",
  item: string,
): number | [number, number] {
  if (item === "-") {
    if (dimension == "F") {
      return [2 ** zoomLevel - 1, -(2 ** zoomLevel)];
    } else {
      if (zoomLevel == 0) {
        return 0;
      } else {
        return [0, 2 ** zoomLevel - 1];
      }
    }
  } else if (item.endsWith(":-")) {
    const start = Number(item.split(":")[0]);
    if (dimension === "F") {
      return [start, 2 ** zoomLevel - 1];
    } else {
      return [start, 2 ** zoomLevel - 1];
    }
  } else if (item.startsWith("-:")) {
    const end = Number(item.split(":")[1]);
    if (dimension === "F") {
      return [-(2 ** zoomLevel), end];
    } else {
      return [0, end];
    }
  } else if (item.indexOf(":") != -1) {
    let itemList = item.split(":");
    const start = Number(itemList[0]);
    const end = Number(itemList[1]);
    if (dimension !== "X") {
      return [Math.min(start, end), Math.max(start, end)];
    }
    return [start, end];
  } else {
    return Number(item);
  }
}

function parseTimePart(timePart: string | null): {
  startTime: number | null;
  endTime: number | null;
} {
  if (timePart === null) {
    return { startTime: null, endTime: null };
  }

  const parts = timePart.split("/");
  const interval = Number(parts[0]);
  const tPart = parts[1];

  if (tPart === "-") {
    return { startTime: null, endTime: null };
  } else if (tPart.endsWith(":-")) {
    const t = Number(tPart.split(":")[0]);
    return { startTime: interval * t, endTime: Infinity };
  } else if (tPart.startsWith("-:")) {
    const t = Number(tPart.split(":")[1]);
    return { startTime: 0, endTime: interval * (t + 1) };
  } else if (tPart.indexOf(":") !== -1) {
    const tList = tPart.split(":");
    const t1 = Number(tList[0]);
    const t2 = Number(tList[1]);
    return { startTime: interval * t1, endTime: interval * (t2 + 1) };
  } else {
    const t = Number(tPart);
    return { startTime: interval * t, endTime: interval * (t + 1) };
  }
}
