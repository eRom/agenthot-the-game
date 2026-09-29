// Aspect des balles, en calcul pur (testé sans Three.js) : longueur de traînée et taille de la tête.
import type { Vec3 } from "../sim/vec3";

export const BULLET_LOOK = {
  // Traînée orange de 2 à 4 m (spec 5.3) : 4 m au plus.
  trailMax: 4,
  // Rayon de la tête dessinée (la zone de touche reste BULLET.radius).
  headRadius: 0.07,
  // Rien de la balle n'entre dans cette sphère autour de la caméra : sinon elle couvre l'écran.
  cameraClearance: 0.5,
  // La tête grandit de 0 à sa taille entre ces deux distances à la caméra.
  headFadeNear: 0.5,
  headFadeFar: 1.2,
} as const;

// Longueur de traînée, derrière la tête et à l'opposé de la vitesse :
// - au plus trailMax ;
// - jamais au-delà du point de départ (sinon elle traverse le tireur) ;
// - coupée avant d'entrer dans la sphère de dégagement de la caméra.
export function trailLength(pos: Vec3, vel: Vec3, origin: Vec3, cam: Vec3): number {
  let len = Math.min(BULLET_LOOK.trailMax, Math.hypot(pos.x - origin.x, pos.y - origin.y, pos.z - origin.z));
  const speed = Math.hypot(vel.x, vel.y, vel.z);
  if (speed < 1e-6) return 0;
  // Direction de la traînée (−vitesse) et caméra vue depuis la tête.
  const tx = -vel.x / speed;
  const ty = -vel.y / speed;
  const tz = -vel.z / speed;
  const cx = cam.x - pos.x;
  const cy = cam.y - pos.y;
  const cz = cam.z - pos.z;
  const along = cx * tx + cy * ty + cz * tz;
  if (along <= 0) return len;
  const r = BULLET_LOOK.cameraClearance;
  const perpSq = cx * cx + cy * cy + cz * cz - along * along;
  if (perpSq >= r * r) return len;
  // Point où la traînée entre dans la sphère de dégagement.
  const entry = along - Math.sqrt(r * r - perpSq);
  len = Math.min(len, Math.max(0, entry));
  return len;
}

// Échelle de la tête (0 à 1) selon sa distance à la caméra.
export function headScale(pos: Vec3, cam: Vec3): number {
  const d = Math.hypot(pos.x - cam.x, pos.y - cam.y, pos.z - cam.z);
  const t = (d - BULLET_LOOK.headFadeNear) / (BULLET_LOOK.headFadeFar - BULLET_LOOK.headFadeNear);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * (3 - 2 * t);
}
