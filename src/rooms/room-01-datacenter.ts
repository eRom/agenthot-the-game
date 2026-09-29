// Salle 1 : la salle serveurs (spec section 5.7). Agencement de départ, à régler en phase « gris ».
import { type Aabb, aabb } from "../sim/geometry";
import { vec3 } from "../sim/vec3";
import type { RoomDefinition } from "./types";

// Salle de 24 × 16 m : x dans [-12, 12], z dans [-8, 8]. Le joueur part côté +Z et regarde vers -Z.
const HALF_X = 12;
const HALF_Z = 8;
const WALL = 0.5;
const WALL_HEIGHT = 6;

const RACK_WIDTH = 1.0;
const RACK_DEPTH = 0.8;
const RACK_HEIGHT = 2.2;
const RACK_ROWS_X = [-7.5, -2.5, 2.5, 7.5];
// Deux tronçons par rangée, séparés par un passage vers z = -0,4.
const RACK_Z_CENTERS = [-4.6, -3.8, -3.0, -2.2, -1.4, 0.6, 1.4, 2.2, 3.0];

const boxes: Aabb[] = [
  // Murs extérieurs.
  aabb(-HALF_X - WALL, 0, -HALF_Z - WALL, HALF_X + WALL, WALL_HEIGHT, -HALF_Z),
  aabb(-HALF_X - WALL, 0, HALF_Z, HALF_X + WALL, WALL_HEIGHT, HALF_Z + WALL),
  aabb(-HALF_X - WALL, 0, -HALF_Z, -HALF_X, WALL_HEIGHT, HALF_Z),
  aabb(HALF_X, 0, -HALF_Z, HALF_X + WALL, WALL_HEIGHT, HALF_Z),
  // Cage d'ascenseur au fond.
  aabb(-1.5, 0, -HALF_Z, 1.5, 3, -7.2),
  // Plancher de la passerelle, côté gauche, à 3,4 m : inaccessible au joueur (saut max ≈ 1,54 m).
  aabb(-HALF_X, 3.4, -HALF_Z, -10, 3.5, 6),
];

const rackBoxIndices: number[] = [];
for (const x of RACK_ROWS_X) {
  for (const z of RACK_Z_CENTERS) {
    rackBoxIndices.push(boxes.length);
    boxes.push(
      aabb(x - RACK_WIDTH / 2, 0, z - RACK_DEPTH / 2, x + RACK_WIDTH / 2, RACK_HEIGHT, z + RACK_DEPTH / 2),
    );
  }
}

// Index d'une baie par rangée (0 à 3) et position dans la rangée (0 à 8).
function rackIndex(row: number, slot: number): number {
  return rackBoxIndices[row * RACK_Z_CENTERS.length + slot]!;
}

// Graphe de navigation : colonnes des allées × trois lignes (fond, passage, entrée).
const NAV_X = [-10, -5, 0, 5, 10];
const NAV_Z = [-6.3, -0.4, 5];
const nodes = [];
const edges: [number, number][] = [];
for (let zi = 0; zi < NAV_Z.length; zi++) {
  for (let xi = 0; xi < NAV_X.length; xi++) {
    nodes.push(vec3(NAV_X[xi], 0, NAV_Z[zi]));
    const id = zi * NAV_X.length + xi;
    if (xi > 0) edges.push([id - 1, id]);
    if (zi > 0) edges.push([id - NAV_X.length, id]);
  }
}

export const room01: RoomDefinition = {
  id: "room-01",
  title: "Salle serveurs",
  boxes,
  rackBoxIndices,
  playerStart: vec3(0, 0, 6.5),
  playerYaw: 0,
  startWithWeapon: true,
  spawns: [
    { pos: vec3(-5, 0, -6.3), yaw: Math.PI, armed: true, mobile: true, trigger: { kind: "start" } },
    { pos: vec3(5, 0, -6.3), yaw: Math.PI, armed: true, mobile: true, trigger: { kind: "start" } },
    // Sur la passerelle, à son poste.
    { pos: vec3(-11, 3.5, -2), yaw: -Math.PI / 2, armed: true, mobile: false, trigger: { kind: "start" } },
    // Sortent des baies quand il ne reste que 2 ennemis.
    {
      pos: vec3(-2.5, 0, -3.0),
      yaw: Math.PI,
      armed: true,
      mobile: true,
      trigger: { kind: "remaining", count: 2 },
      burstBoxIndex: rackIndex(1, 2),
    },
    {
      pos: vec3(7.5, 0, 1.4),
      yaw: Math.PI,
      armed: false,
      mobile: true,
      trigger: { kind: "remaining", count: 2 },
      burstBoxIndex: rackIndex(3, 6),
    },
  ],
  nav: { nodes, edges },
};
