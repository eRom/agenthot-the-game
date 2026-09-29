// Éclats de verre : données seulement, le rendu les dessine en InstancedMesh (spec section 5.8).
import type { Aabb } from "./geometry";
import { Rng } from "./rng";
import { type Vec3, set, vec3 } from "./vec3";

export const SHATTER = {
  capacity: 320,
  shardsPerBody: 36,
  shardsPerBox: 24,
  gravity: 9.81,
  restitution: 0.3,
  friction: 0.5,
  // Force de dispersion aléatoire, en m/s.
  spread: 3,
  impactShare: 0.6,
  // Plafond (m/s) de la part d'impact transmise aux éclats. Décision de Romain le 2026-09-29 (spec 5.8) :
  // sans lui, une balle à 45 m/s donnait 27 m/s aux éclats, projetés hors de la salle et à travers les murs.
  maxImpactSpeed: 5,
} as const;

// 0 = menace (orange), 1 = décor (blanc), 2 = encre (joueur).
export type ShardKind = 0 | 1 | 2;

export interface Shard {
  active: boolean;
  resting: boolean;
  bounced: boolean;
  kind: ShardKind;
  size: number;
  pos: Vec3;
  vel: Vec3;
  axis: Vec3;
  angle: number;
  angVel: number;
}

export class ShatterSystem {
  readonly shards: Shard[] = [];
  private cursor = 0;
  private readonly rng = new Rng();

  constructor() {
    for (let i = 0; i < SHATTER.capacity; i++) {
      this.shards.push({
        active: false,
        resting: false,
        bounced: false,
        kind: 0,
        size: 0,
        pos: vec3(),
        vel: vec3(),
        axis: vec3(0, 1, 0),
        angle: 0,
        angVel: 0,
      });
    }
  }

  reset(): void {
    for (const s of this.shards) s.active = false;
    this.cursor = 0;
  }

  // Fait éclater un corps (capsule verticale posée sur `base`).
  spawnBody(base: Vec3, height: number, radius: number, impactVel: Vec3, seed: number, kind: ShardKind): void {
    this.rng.reset(seed);
    cappedImpact(impactVel);
    for (let i = 0; i < SHATTER.shardsPerBody; i++) {
      const s = this.take();
      const a = this.rng.range(0, Math.PI * 2);
      const r = this.rng.range(0, radius);
      set(s.pos, base.x + Math.cos(a) * r, base.y + this.rng.range(0.1, height), base.z + Math.sin(a) * r);
      this.launch(s, kind, this.rng.range(0.05, 0.14));
    }
  }

  // Fait éclater une boîte du décor (baie de serveurs qui explose).
  spawnBox(box: Aabb, seed: number): void {
    this.rng.reset(seed);
    set(shareVel, 0, 0, 0);
    for (let i = 0; i < SHATTER.shardsPerBox; i++) {
      const s = this.take();
      set(
        s.pos,
        this.rng.range(box.min.x, box.max.x),
        this.rng.range(box.min.y, box.max.y),
        this.rng.range(box.min.z, box.max.z),
      );
      this.launch(s, 1, this.rng.range(0.1, 0.25));
    }
  }

  // `boxes` et `enabled` : le décor sur lequel les éclats peuvent se poser (passerelle, haut des baies).
  // Sans décor, le sol est en y = 0.
  step(dt: number, boxes: readonly Aabb[] = NO_BOXES, enabled: readonly boolean[] = NO_FLAGS): void {
    if (dt <= 0) return;
    for (const s of this.shards) {
      if (!s.active || s.resting) continue;
      const prevY = s.pos.y;
      s.vel.y -= SHATTER.gravity * dt;
      s.pos.x += s.vel.x * dt;
      s.pos.y += s.vel.y * dt;
      s.pos.z += s.vel.z * dt;
      s.angle += s.angVel * dt;
      const floor = groundBelow(s.pos.x, s.pos.z, prevY, boxes, enabled) + s.size * 0.5;
      if (s.pos.y <= floor && s.vel.y < 0) {
        s.pos.y = floor;
        if (!s.bounced) {
          s.bounced = true;
          s.vel.y = -s.vel.y * SHATTER.restitution;
          s.vel.x *= SHATTER.friction;
          s.vel.z *= SHATTER.friction;
          s.angVel *= SHATTER.friction;
        } else {
          // Deuxième contact : l'éclat se fige pour libérer le processeur.
          s.resting = true;
          set(s.vel, 0, 0, 0);
          s.angVel = 0;
        }
      }
    }
  }

  private take(): Shard {
    const s = this.shards[this.cursor]!;
    this.cursor = (this.cursor + 1) % this.shards.length;
    return s;
  }

  // La part d'impact (déjà plafonnée) est lue dans `shareVel`, renseigné par spawnBody / spawnBox.
  private launch(s: Shard, kind: ShardKind, size: number): void {
    s.active = true;
    s.resting = false;
    s.bounced = false;
    s.kind = kind;
    s.size = size;
    // Direction aléatoire uniforme sur la sphère.
    const u = this.rng.range(-1, 1);
    const phi = this.rng.range(0, Math.PI * 2);
    const k = Math.sqrt(1 - u * u);
    const force = this.rng.range(0.3, 1) * SHATTER.spread;
    set(
      s.vel,
      shareVel.x + k * Math.cos(phi) * force,
      shareVel.y + Math.abs(u) * force,
      shareVel.z + k * Math.sin(phi) * force,
    );
    set(s.axis, this.rng.range(-1, 1), this.rng.range(-1, 1), this.rng.range(-1, 1));
    const len = Math.hypot(s.axis.x, s.axis.y, s.axis.z) || 1;
    s.axis.x /= len;
    s.axis.y /= len;
    s.axis.z /= len;
    s.angle = this.rng.range(0, Math.PI * 2);
    s.angVel = this.rng.range(-12, 12);
  }
}

// Part d'impact transmise aux éclats du corps ou de la boîte en cours d'éclatement.
const shareVel = vec3();
const NO_BOXES: readonly Aabb[] = [];
const NO_FLAGS: readonly boolean[] = [];

// Calcule dans `shareVel` la part d'impact des éclats : `impactShare` × impact, plafonnée en norme à `maxImpactSpeed`.
function cappedImpact(impactVel: Vec3): void {
  set(shareVel, impactVel.x * SHATTER.impactShare, impactVel.y * SHATTER.impactShare, impactVel.z * SHATTER.impactShare);
  const speed = Math.hypot(shareVel.x, shareVel.y, shareVel.z);
  if (speed <= SHATTER.maxImpactSpeed) return;
  const k = SHATTER.maxImpactSpeed / speed;
  set(shareVel, shareVel.x * k, shareVel.y * k, shareVel.z * k);
}

// Hauteur du sol sous (x, z) : le dessus le plus haut d'une boîte active située sous `fromY`, ou 0.
function groundBelow(x: number, z: number, fromY: number, boxes: readonly Aabb[], enabled: readonly boolean[]): number {
  let ground = 0;
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i]!;
    if (!enabled[i] || b.max.y > fromY || b.max.y <= ground) continue;
    if (x < b.min.x || x > b.max.x || z < b.min.z || z > b.max.z) continue;
    ground = b.max.y;
  }
  return ground;
}
