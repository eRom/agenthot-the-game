// Format d'une salle : une salle = un module de données (spec section 9.1).
import type { Aabb } from "../sim/geometry";
import type { Vec3 } from "../sim/vec3";

export type SpawnTrigger = { kind: "start" } | { kind: "remaining"; count: number };

export interface EnemySpawn {
  pos: Vec3;
  // Lacet en radians : 0 regarde vers -Z.
  yaw: number;
  armed: boolean;
  // Faux : l'ennemi reste à son poste (passerelle).
  mobile: boolean;
  trigger: SpawnTrigger;
  // Index de la boîte (baie) qui explose à l'apparition.
  burstBoxIndex?: number;
}

export interface NavGraph {
  nodes: Vec3[];
  edges: [number, number][];
}

export interface RoomDefinition {
  id: string;
  title: string;
  boxes: Aabb[];
  // Indices des boîtes dessinées comme baies de serveurs (instanciées au rendu).
  rackBoxIndices: number[];
  playerStart: Vec3;
  playerYaw: number;
  startWithWeapon: boolean;
  spawns: EnemySpawn[];
  nav: NavGraph;
}

export interface RoomEntry {
  id: string;
  title: string;
  status: "playable" | "locked";
  definition?: RoomDefinition;
}
