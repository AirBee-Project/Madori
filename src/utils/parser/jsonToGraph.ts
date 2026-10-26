import { type GraphFile, GraphFileSchema } from "../../types/geometry/graph";

/**
 * アップロードされたグラフJSON文字列 (schema.json / UndirectedSpatialGraph) を
 * 検証し、GraphFile型に変換する。
 *
 * 形式が不正な場合や、adjacencyがnodesに存在しないノードIDを参照している場合は
 * エラーを投げる。
 */
export function jsonToGraph(jsonString: string): GraphFile {
  const parsed = JSON.parse(jsonString);
  const validated = GraphFileSchema.parse(parsed);

  const nodeIds = new Set(Object.keys(validated.nodes));

  if (nodeIds.size === 0) {
    throw new Error("nodesが空です。");
  }

  for (const [nodeId, edges] of Object.entries(validated.adjacency)) {
    if (!nodeIds.has(nodeId)) {
      throw new Error(
        `adjacencyに存在しないノードID「${nodeId}」が含まれています。`,
      );
    }
    for (const edge of edges) {
      if (!nodeIds.has(edge.node)) {
        throw new Error(
          `ノード「${nodeId}」のエッジが参照するノードID「${edge.node}」がnodesに存在しません。`,
        );
      }
    }
  }

  return validated;
}
