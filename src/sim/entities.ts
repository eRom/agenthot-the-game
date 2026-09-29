// Entités de la simulation et leurs réglages (spec sections 5.2 à 5.6).
import { type Vec3, vec3 } from "./vec3";

export const PLAYER_ID = 0;
export const NO_ID = -1;

export const PLAYER = {
  speed: 4.2,
  jumpSpeed: 5.5,
  gravity: 9.81,
  radius: 0.3,
  height: 1.8,
  crouchHeight: 0.95,
  eyeStand: 1.7,
  eyeCrouch: 0.85,
  // Vitesse (par seconde réelle) à laquelle les yeux rejoignent leur hauteur : pas de saut de caméra.
  eyeRate: 14,
  // Hauteur du torse, pour la capture d'arme au vol.
  chest: 1.2,
  // Hauteur du torse accroupi : la capsule s'arrête à 0,95 m, les tireurs visent dessous.
  crouchChest: 0.6,
  punchRange: 1.6,
  pickupRange: 2,
  catchRadius: 1.3,
  throwSpeed: 22,
  throwLift: 1,
  fireCooldown: 0.45,
  maxPitch: Math.PI / 2 - 0.05,
} as const;

export const ENEMY = {
  speed: 3.2,
  radius: 0.3,
  height: 1.8,
  eyeHeight: 1.55,
  muzzleHeight: 1.4,
  handHeight: 1.3,
  aimTime: 0.4,
  cooldown: 0.9,
  staggerTime: 1.5,
  fireRange: 8,
  meleeRange: 1.2,
  meleeWindup: 0.35,
  // Écart de hauteur maximal pour qu'un coup de mêlée porte (passerelle au-dessus du joueur).
  meleeReachY: 1,
  repathInterval: 0.5,
  // Distance à laquelle un nœud du chemin est considéré atteint.
  waypointReach: 0.4,
  // Arme éjectée : vitesse vers le haut, puis vers celui qui a frappé.
  ejectUp: 4.5,
  ejectToward: 2.5,
  // Arme d'un ennemi tué : vitesse horizontale dans le sens de l'impact.
  ejectOnDeath: 1.5,
} as const;

export const WEAPON = {
  capacity: 4,
  radius: 0.15,
  gravity: 9.81,
  spin: 15,
  // Délai avant que le joueur puisse rattraper sa propre arme lancée.
  catchGrace: 0.25,
  bounceDamping: 0.4,
} as const;

export const BULLET = {
  speed: 45,
  radius: 0.04,
  maxLife: 4,
  // Frôlement : une balle ennemie passe à moins de cette distance de la tête sans toucher (spec 7.3).
  nearMissRadius: 0.6,
} as const;

export const POOLS = {
  enemies: 8,
  weapons: 8,
  bullets: 32,
} as const;

export interface Player {
  pos: Vec3;
  // Vitesse horizontale réelle (m/s) et vitesse verticale.
  vel: Vec3;
  yaw: number;
  pitch: number;
  onGround: boolean;
  crouching: boolean;
  // Hauteur des yeux, lissée entre debout et accroupi.
  eyeHeight: number;
  alive: boolean;
  weaponId: number;
  fireCooldown: number;
}

export type EnemyState = "inactive" | "approach" | "aim" | "cooldown" | "stagger" | "windup" | "dead";

export interface Enemy {
  id: number;
  state: EnemyState;
  pos: Vec3;
  yaw: number;
  mobile: boolean;
  weaponId: number;
  stateTime: number;
  // Distance marchée depuis l'apparition (m) : cadence du cycle de marche au rendu.
  walkDistance: number;
  aimPoint: Vec3;
  path: Int32Array;
  pathLength: number;
  pathIndex: number;
  repathTimer: number;
}

export type WeaponState = "free" | "held" | "flying" | "ground";

export interface Weapon {
  id: number;
  state: WeaponState;
  holderId: number;
  ammo: number;
  pos: Vec3;
  vel: Vec3;
  angle: number;
  bounced: boolean;
  thrownBy: number;
  flightTime: number;
}

export interface Bullet {
  active: boolean;
  ownerId: number;
  pos: Vec3;
  vel: Vec3;
  // Point de départ : le rendu y arrête la traînée, pour qu'elle ne traverse pas le tireur.
  origin: Vec3;
  life: number;
  // Vrai une fois le frôlement émis : un seul par balle.
  nearMissed: boolean;
}

export function createPlayer(): Player {
  return {
    pos: vec3(),
    vel: vec3(),
    yaw: 0,
    pitch: 0,
    onGround: true,
    crouching: false,
    eyeHeight: PLAYER.eyeStand,
    alive: true,
    weaponId: NO_ID,
    fireCooldown: 0,
  };
}

export function createEnemy(id: number, navSize: number): Enemy {
  return {
    id,
    state: "inactive",
    pos: vec3(),
    yaw: 0,
    mobile: true,
    weaponId: NO_ID,
    stateTime: 0,
    walkDistance: 0,
    aimPoint: vec3(),
    path: new Int32Array(Math.max(1, navSize)),
    pathLength: 0,
    pathIndex: 0,
    repathTimer: 0,
  };
}

export function createWeapon(id: number): Weapon {
  return {
    id,
    state: "free",
    holderId: NO_ID,
    ammo: 0,
    pos: vec3(),
    vel: vec3(),
    angle: 0,
    bounced: false,
    thrownBy: NO_ID,
    flightTime: 0,
  };
}

export function createBullet(): Bullet {
  return { active: false, ownerId: NO_ID, pos: vec3(), vel: vec3(), origin: vec3(), life: 0, nearMissed: false };
}

// Direction du regard : lacet 0 = -Z, tangage positif = vers le haut.
export function forwardFromAngles(out: Vec3, yaw: number, pitch: number): Vec3 {
  const cp = Math.cos(pitch);
  out.x = -Math.sin(yaw) * cp;
  out.y = Math.sin(pitch);
  out.z = -Math.cos(yaw) * cp;
  return out;
}

export function isAlive(e: Enemy): boolean {
  return e.state !== "inactive" && e.state !== "dead";
}
