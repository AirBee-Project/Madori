import type { VoxelDefinition } from "../types/VoxelDefinition";

export default function hyperVoxelParse(
  voxelsString: string
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

  //時間に関する情報を削除
  voxelStringList = voxelStringList.map((voxelString) => {
    if (!voxelString) return "";
    const underscoreIndex = voxelString.indexOf("_");
    if (underscoreIndex !== -1) {
      return voxelString.substring(0, underscoreIndex);
    }
    return voxelString;
  });
  //型に変換
  for (let i = 0; i < voxelStringList.length; i++) {
    if (voxelStringList[i] === "") {
      continue;
    }
    let voxelParseList = voxelStringList[i].split("/");
    let zValue: number = Number(voxelParseList[0]);
    let resultVoxel: VoxelDefinition = {
      Z: zValue,
      F: parseDimensionRange(zValue, "F", voxelParseList[1]),
      X: parseDimensionRange(zValue, "X", voxelParseList[2]),
      Y: parseDimensionRange(zValue, "Y", voxelParseList[3]),
    };
    result.push(resultVoxel);
  }

  console.log(result);
  return result;
}

function parseDimensionRange(
  zoomLevel: number,
  dimension: "X" | "Y" | "F",
  item: string
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
  } else if (item.indexOf(":") != -1) {
    let itemList = item.split(":");
    let numberItemList: number[] = itemList.map((num) => Number(num));
    numberItemList = numberItemList.sort();
    console.log(numberItemList);
    return [numberItemList[0], numberItemList[1]];
  } else {
    return Number(item);
  }
}
