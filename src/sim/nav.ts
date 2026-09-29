// Navigation des ennemis : plus court chemin (en nombre d'arêtes) sur le graphe de la salle.
import type { NavGraph } from "../rooms/types";
import type { Vec3 } from "./vec3";

export class Navigator {
  private readonly adjacency: number[][];
  private readonly queue: Int32Array;
  private readonly parent: Int32Array;
  readonly graph: NavGraph;

  constructor(graph: NavGraph) {
    this.graph = graph;
    const n = graph.nodes.length;
    this.adjacency = graph.nodes.map(() => []);
    for (const [a, b] of graph.edges) {
      this.adjacency[a]!.push(b);
      this.adjacency[b]!.push(a);
    }
    this.queue = new Int32Array(n);
    this.parent = new Int32Array(n);
  }

  nearestNode(p: Vec3): number {
    let best = -1;
    let bestDist = Infinity;
    const nodes = this.graph.nodes;
    for (let i = 0; i < nodes.length; i++) {
      const dx = nodes[i]!.x - p.x;
      const dz = nodes[i]!.z - p.z;
      const d = dx * dx + dz * dz;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  // Écrit le chemin (indices de nœuds, départ exclu) dans `out`. Renvoie sa longueur.
  findPath(from: Vec3, to: Vec3, out: Int32Array): number {
    const start = this.nearestNode(from);
    const goal = this.nearestNode(to);
    if (start < 0 || goal < 0) return 0;
    if (start === goal) {
      out[0] = goal;
      return 1;
    }
    this.parent.fill(-1);
    this.parent[start] = start;
    let head = 0;
    let tail = 0;
    this.queue[tail++] = start;
    while (head < tail) {
      const node = this.queue[head++]!;
      if (node === goal) break;
      for (const next of this.adjacency[node]!) {
        if (this.parent[next] !== -1) continue;
        this.parent[next] = node;
        this.queue[tail++] = next;
      }
    }
    if (this.parent[goal] === -1) return 0;
    // Remonte du but vers le départ, puis inverse dans `out`.
    let length = 0;
    for (let node = goal; node !== start; node = this.parent[node]!) length++;
    let i = length - 1;
    for (let node = goal; node !== start; node = this.parent[node]!) out[i--] = node;
    return Math.min(length, out.length);
  }
}
