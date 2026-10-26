import type { GraphGroup } from "../../types/geometry/graph";

export interface GraphPointGeometry {
  id: string;
  longitude: number;
  latitude: number;
  altitude: number;
}

export interface GraphEdgeGeometry {
  id: string;
  start: { longitude: number; latitude: number; altitude: number };
  end: { longitude: number; latitude: number; altitude: number };
  cost: number;
  risk: number;
}

export interface GraphGeometries {
  points: GraphPointGeometry[];
  edges: GraphEdgeGeometry[];
}

/**
 * グラフグループ（頂点・隣接リスト）を描画用のジオメトリに変換する。
 *
 * adjacencyは無向グラフの両方向分（a→b, b→a）を含み得るため、
 * 同じ頂点ペアの辺は1本にまとめて重複描画を避ける。
 */
export function graphGroupToGeometries(group: GraphGroup): GraphGeometries {
  const points: GraphPointGeometry[] = Object.entries(group.nodes).map(
    ([id, node]) => ({
      id,
      longitude: node.longitude,
      latitude: node.latitude,
      altitude: node.altitude,
    }),
  );

  const edges: GraphEdgeGeometry[] = [];
  const seenPairs = new Set<string>();

  for (const [nodeId, edgeList] of Object.entries(group.adjacency)) {
    const start = group.nodes[nodeId];
    if (!start) continue;

    for (const edge of edgeList) {
      const pairKey = [nodeId, edge.node].sort().join("|");
      if (seenPairs.has(pairKey)) continue;

      const end = group.nodes[edge.node];
      if (!end) continue;

      seenPairs.add(pairKey);
      edges.push({
        id: pairKey,
        start: {
          longitude: start.longitude,
          latitude: start.latitude,
          altitude: start.altitude,
        },
        end: {
          longitude: end.longitude,
          latitude: end.latitude,
          altitude: end.altitude,
        },
        cost: edge.cost,
        risk: edge.risk,
      });
    }
  }

  return { points, edges };
}
