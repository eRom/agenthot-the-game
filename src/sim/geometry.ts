// Requêtes géométriques de la simulation : boîtes alignées, capsules verticales, segments.
import { type Vec3, vec3 } from "./vec3";

export interface Aabb {
  min: Vec3;
  max: Vec3;
}

export function aabb(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): Aabb {
  return { min: vec3(minX, minY, minZ), max: vec3(maxX, maxY, maxZ) };
}

// Premier contact d'une sphère qui balaie le segment p0 → p1 contre une boîte.
// La boîte est gonflée du rayon (coins non arrondis : léger excès, sans danger ici).
// Renvoie t dans [0, 1], ou -1 sans contact.
let slabMin = 0;
let slabMax = 1;
let slabAxis = -1;
let slabSign = 0;

// Face touchée par le dernier balayage réussi : axe (0 = x, 1 = y, 2 = z) et signe de la normale sortante
// (+1 : face haute de l'axe, -1 : face basse). Axe -1 : le départ était déjà dans la boîte gonflée ou sur sa
// surface, sans face d'entrée. Valeur d'un module, relue juste après l'appel : aucune allocation.
export const sweepFace = { axis: -1, sign: 0 };

// Restreint [slabMin, slabMax] sur un axe. Renvoie faux si l'intervalle devient vide.
function clipSlab(axis: number, origin: number, dir: number, lo: number, hi: number): boolean {
  if (Math.abs(dir) < 1e-12) return origin >= lo && origin <= hi;
  let t1 = (lo - origin) / dir;
  let t2 = (hi - origin) / dir;
  // Avançant vers +axe, on entre par la face basse (normale -axe) ; vers -axe, par la face haute.
  const entrySign = dir > 0 ? -1 : 1;
  if (t1 > t2) {
    const tmp = t1;
    t1 = t2;
    t2 = tmp;
  }
  if (t1 > slabMin) {
    slabMin = t1;
    slabAxis = axis;
    slabSign = entrySign;
  }
  if (t2 < slabMax) slabMax = t2;
  return slabMin <= slabMax;
}

export function sweepSphereAabb(p0: Vec3, p1: Vec3, radius: number, box: Aabb): number {
  slabMin = 0;
  slabMax = 1;
  slabAxis = -1;
  slabSign = 0;
  if (!clipSlab(0, p0.x, p1.x - p0.x, box.min.x - radius, box.max.x + radius)) return -1;
  if (!clipSlab(1, p0.y, p1.y - p0.y, box.min.y - radius, box.max.y + radius)) return -1;
  if (!clipSlab(2, p0.z, p1.z - p0.z, box.min.z - radius, box.max.z + radius)) return -1;
  sweepFace.axis = slabAxis;
  sweepFace.sign = slabSign;
  return slabMin;
}

// Paramètres des points les plus proches entre deux segments (Ericson, Real-Time Collision Detection 5.1.9).
const closest = { s: 0, t: 0, distSq: 0 };

export function closestSegmentSegment(p1: Vec3, q1: Vec3, p2: Vec3, q2: Vec3): typeof closest {
  const d1x = q1.x - p1.x, d1y = q1.y - p1.y, d1z = q1.z - p1.z;
  const d2x = q2.x - p2.x, d2y = q2.y - p2.y, d2z = q2.z - p2.z;
  const rx = p1.x - p2.x, ry = p1.y - p2.y, rz = p1.z - p2.z;
  const a = d1x * d1x + d1y * d1y + d1z * d1z;
  const e = d2x * d2x + d2y * d2y + d2z * d2z;
  const f = d2x * rx + d2y * ry + d2z * rz;
  let s = 0;
  let t = 0;
  if (a <= 1e-12 && e <= 1e-12) {
    s = 0;
    t = 0;
  } else if (a <= 1e-12) {
    s = 0;
    t = Math.min(1, Math.max(0, f / e));
  } else {
    const c = d1x * rx + d1y * ry + d1z * rz;
    if (e <= 1e-12) {
      t = 0;
      s = Math.min(1, Math.max(0, -c / a));
    } else {
      const b = d1x * d2x + d1y * d2y + d1z * d2z;
      const denom = a * e - b * b;
      s = denom !== 0 ? Math.min(1, Math.max(0, (b * f - c * e) / denom)) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = Math.min(1, Math.max(0, -c / a));
      } else if (t > 1) {
        t = 1;
        s = Math.min(1, Math.max(0, (b - c) / a));
      }
    }
  }
  const cx = p1.x + d1x * s - (p2.x + d2x * t);
  const cy = p1.y + d1y * s - (p2.y + d2y * t);
  const cz = p1.z + d1z * s - (p2.z + d2z * t);
  closest.s = s;
  closest.t = t;
  closest.distSq = cx * cx + cy * cy + cz * cz;
  return closest;
}

const capA = vec3();
const capB = vec3();

// Contact d'une sphère qui balaie p0 → p1 avec une capsule verticale posée sur `base`.
// Renvoie t approché (point le plus proche sur le segment), ou -1.
export function sweepSphereCapsule(
  p0: Vec3,
  p1: Vec3,
  radius: number,
  base: Vec3,
  height: number,
  capRadius: number,
): number {
  capA.x = base.x;
  capA.y = base.y + capRadius;
  capA.z = base.z;
  capB.x = base.x;
  capB.y = base.y + height - capRadius;
  capB.z = base.z;
  const r = radius + capRadius;
  const c = closestSegmentSegment(p0, p1, capA, capB);
  return c.distSq <= r * r ? c.s : -1;
}

// Repousse un cercle (plan XZ) hors des boîtes qu'il chevauche en hauteur.
export function pushCircleOutOfAabbs(pos: Vec3, radius: number, height: number, boxes: readonly Aabb[], enabled?: readonly boolean[]): void {
  for (let i = 0; i < boxes.length; i++) {
    if (enabled && !enabled[i]) continue;
    const box = boxes[i]!;
    if (pos.y + height <= box.min.y || pos.y >= box.max.y) continue;
    const cx = Math.max(box.min.x, Math.min(pos.x, box.max.x));
    const cz = Math.max(box.min.z, Math.min(pos.z, box.max.z));
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const distSq = dx * dx + dz * dz;
    if (distSq >= radius * radius) continue;
    if (distSq > 1e-12) {
      const dist = Math.sqrt(distSq);
      pos.x = cx + (dx / dist) * radius;
      pos.z = cz + (dz / dist) * radius;
    } else {
      // Centre à l'intérieur : on sort par la face la plus proche.
      const left = pos.x - box.min.x;
      const right = box.max.x - pos.x;
      const back = pos.z - box.min.z;
      const front = box.max.z - pos.z;
      const m = Math.min(left, right, back, front);
      if (m === left) pos.x = box.min.x - radius;
      else if (m === right) pos.x = box.max.x + radius;
      else if (m === back) pos.z = box.min.z - radius;
      else pos.z = box.max.z + radius;
    }
  }
}

// Vrai si le segment a → b traverse une boîte active (ligne de vue bloquée).
export function segmentBlocked(a: Vec3, b: Vec3, boxes: readonly Aabb[], enabled?: readonly boolean[]): boolean {
  for (let i = 0; i < boxes.length; i++) {
    if (enabled && !enabled[i]) continue;
    if (sweepSphereAabb(a, b, 0, boxes[i]!) >= 0) return true;
  }
  return false;
}
