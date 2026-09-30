// Éclats de verre : données seulement, le rendu les dessine en InstancedMesh (spec section 5.8).
import { type Aabb, sweepFace, sweepSphereAabb } from "./geometry";
import { Rng } from "./rng";
import { type Vec3, lerp, set, vec3 } from "./vec3";

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
  // Contre une face latérale, l'éclat s'arrête un peu avant le point de contact (part du pas, comme pour
  // les armes) : posé pile sur la surface, il y serait de nouveau détecté au pas suivant.
  contactBackoff: 0.05,
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

  // `boxes` et `enabled` : le décor contre lequel les éclats se posent et rebondissent (passerelle, baies, murs).
  // La partie et le replay passent les mêmes boîtes, et chacun ses propres drapeaux de boîtes actives.
  // Sans décor, le sol est en y = 0.
  step(dt: number, boxes: readonly Aabb[] = NO_BOXES, enabled: readonly boolean[] = NO_FLAGS): void {
    if (dt <= 0) return;
    for (const s of this.shards) {
      if (!s.active || s.resting) continue;
      const r = s.size * 0.5;
      // Chute exacte (parabole) : la position d'arrivée ne dépend pas de la taille du pas, donc le jeu (petits pas
      // au ralenti) et le replay (un pas par image) posent les éclats au même endroit.
      const vy0 = s.vel.y;
      // Durée parcourue dans ce pas : tout le pas, ou jusqu'au sol s'il est touché en route. Le sol borne ainsi le
      // trajet avant le balayage (sur un grand pas, la fin du pas passait sous le bas des baies posées au sol).
      const endY = s.pos.y + vy0 * dt - 0.5 * SHATTER.gravity * dt * dt;
      const floorHit = endY < r;
      const span = floorHit ? floorContactTime(s.pos.y - r, vy0, dt) : dt;
      const y = floorHit ? r : endY;
      set(next, s.pos.x + s.vel.x * span, y, s.pos.z + s.vel.z * span);
      s.angle += s.angVel * dt;

      // Premier contact du trajet avec une boîte active (balayage : rien ne traverse un mur mince).
      let bestT = 2;
      let bestBox = -1;
      let bestAxis = -1;
      let bestSign = 0;
      let embedded = -1;
      for (let i = 0; i < boxes.length; i++) {
        if (!enabled[i]) continue;
        const box = boxes[i]!;
        const t = sweepSphereAabb(s.pos, next, r, box);
        if (t < 0) continue;
        if (sweepFace.axis < 0) {
          // Départ dans la boîte gonflée (né dedans) ou juste sur sa surface (éclat qui repart d'une face).
          if (isStrictlyInside(s.pos, box, r)) embedded = i;
          continue;
        }
        if (t < bestT) {
          bestT = t;
          bestBox = i;
          bestAxis = sweepFace.axis;
          bestSign = sweepFace.sign;
        }
      }

      if (embedded >= 0) {
        // Sorti de force par la face la plus proche : il ne reste jamais dans une boîte.
        s.vel.y = vy0 - SHATTER.gravity * dt;
        pushOut(s, boxes[embedded]!, r);
        continue;
      }
      if (bestBox < 0) {
        set(s.pos, next.x, next.y, next.z);
        // Vitesse à l'instant du contact avec le sol (ou en fin de pas) : le rebond ne dépend pas du pas.
        s.vel.y = vy0 - SHATTER.gravity * span;
      } else if (bestAxis === 1 && bestSign > 0) {
        // Arrivée par le dessus (passerelle, haut d'une baie) : même règle que le sol, à la hauteur de la boîte.
        lerp(s.pos, s.pos, next, bestT);
        s.pos.y = boxes[bestBox]!.max.y + r;
        s.vel.y = vy0 - SHATTER.gravity * span * bestT;
        land(s);
        continue;
      } else {
        // Face latérale ou dessous : un peu avant le contact, puis la vitesse sur cet axe se renverse, amortie.
        lerp(s.pos, s.pos, next, Math.max(0, bestT - SHATTER.contactBackoff));
        s.vel.y = vy0 - SHATTER.gravity * span * bestT;
        reflect(s, bestAxis);
        continue;
      }
      // Sol : touché pendant ce pas (décidé une fois, avant le balayage, sans comparer des flottants arrondis).
      if (floorHit && s.vel.y <= 0) land(s);
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
// Position d'arrivée du pas en cours.
const next = vec3();
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

// Instant (s, dans [0, dt]) où un éclat à `height` au-dessus de sa position de repos, de vitesse verticale `vy`,
// touche le sol en chute libre : racine positive de height + vy·t − g·t²/2 = 0.
// Un éclat à hauteur de repos qui remonte (vy > 0) retombe au bout de 2·vy/g : pas de raccourci à height = 0, sinon
// il resterait figé à hauteur de repos sur un grand pas (le temps parcouru serait nul à chaque pas).
function floorContactTime(height: number, vy: number, dt: number): number {
  const t = (vy + Math.sqrt(vy * vy + 2 * SHATTER.gravity * Math.max(0, height))) / SHATTER.gravity;
  return Math.min(dt, t);
}

// Vrai si le centre d'un éclat de rayon `r` est strictement dans la boîte gonflée de `r` (en surface : faux).
function isStrictlyInside(p: Vec3, box: Aabb, r: number): boolean {
  return (
    p.x > box.min.x - r &&
    p.x < box.max.x + r &&
    p.y > box.min.y - r &&
    p.y < box.max.y + r &&
    p.z > box.min.z - r &&
    p.z < box.max.z + r
  );
}

// Atterrissage (sol ou dessus d'une boîte) : un rebond amorti, puis l'éclat se fige au deuxième contact.
function land(s: Shard): void {
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

// Renverse et amortit la vitesse sur un axe (0 = x, 1 = y, 2 = z).
function reflect(s: Shard, axis: number): void {
  if (axis === 0) s.vel.x = -s.vel.x * SHATTER.restitution;
  else if (axis === 1) s.vel.y = -s.vel.y * SHATTER.restitution;
  else s.vel.z = -s.vel.z * SHATTER.restitution;
}

// Sort un éclat né dans une boîte par la face (de la boîte gonflée) la plus proche de son centre.
// La vitesse n'est touchée que si elle poussait vers l'intérieur : un éclat déjà sorti ne repart pas dedans.
function pushOut(s: Shard, box: Aabb, r: number): void {
  const p = s.pos;
  const left = p.x - (box.min.x - r);
  const right = box.max.x + r - p.x;
  // Une boîte posée au sol n'a pas de sortie par-dessous : elle mènerait sous le sol (latent en salle 1, plan 2 M3).
  const below = box.min.y - r >= r ? p.y - (box.min.y - r) : Number.POSITIVE_INFINITY;
  const above = box.max.y + r - p.y;
  const back = p.z - (box.min.z - r);
  const front = box.max.z + r - p.z;
  const m = Math.min(left, right, below, above, back, front);
  if (m === above) {
    p.y = box.max.y + r;
    if (s.vel.y < 0) land(s);
  } else if (m === below) {
    p.y = box.min.y - r;
    if (s.vel.y > 0) reflect(s, 1);
  } else if (m === left) {
    p.x = box.min.x - r;
    if (s.vel.x > 0) reflect(s, 0);
  } else if (m === right) {
    p.x = box.max.x + r;
    if (s.vel.x < 0) reflect(s, 0);
  } else if (m === back) {
    p.z = box.min.z - r;
    if (s.vel.z > 0) reflect(s, 2);
  } else {
    p.z = box.max.z + r;
    if (s.vel.z < 0) reflect(s, 2);
  }
}
