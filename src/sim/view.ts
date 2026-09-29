// Vue du monde lue par le rendu. Le jeu et le replay écrivent la même forme,
// le rendu ne sait pas lequel des deux il dessine.
import { ENEMY, type EnemyState, NO_ID, PLAYER_ID, POOLS, isAlive } from "./entities";
import type { Game } from "./game";
import { playerEye } from "./player-system";
import type { Shard } from "./shatter";
import { type Vec3, copy, vec3 } from "./vec3";

export const ENEMY_STATE_CODES: readonly EnemyState[] = [
  "inactive",
  "approach",
  "aim",
  "cooldown",
  "stagger",
  "windup",
  "dead",
];

export interface EnemyView {
  visible: boolean;
  state: EnemyState;
  pos: Vec3;
  yaw: number;
  aimPoint: Vec3;
  // Progression de l'état en cours, de 0 à 1 (visée, élan, recul du tir, vacillement). 0 en approche.
  stateProgress: number;
  armed: boolean;
  // Distance marchée (m) : phase du cycle de marche.
  walkDistance: number;
}

export interface BulletView {
  active: boolean;
  pos: Vec3;
  vel: Vec3;
  // Point de départ de la balle (fin de la traînée).
  origin: Vec3;
}

export interface WeaponView {
  visible: boolean;
  heldByPlayer: boolean;
  // Porteur : 0 = joueur, 1..n = ennemi, -1 = personne.
  holderId: number;
  pos: Vec3;
  angle: number;
}

export interface WorldView {
  camera: { pos: Vec3; yaw: number; pitch: number };
  enemies: EnemyView[];
  bullets: BulletView[];
  weapons: WeaponView[];
  // Munitions de l'arme du joueur (-1 si mains vides), et temps de recharge restant.
  playerAmmo: number;
  playerCooldown: number;
  shards: Shard[];
  boxEnabled: boolean[];
  timeScale: number;
}

export function createWorldView(boxCount: number, shards: Shard[]): WorldView {
  const view: WorldView = {
    camera: { pos: vec3(), yaw: 0, pitch: 0 },
    enemies: [],
    bullets: [],
    weapons: [],
    playerAmmo: -1,
    playerCooldown: 0,
    shards,
    boxEnabled: new Array<boolean>(boxCount).fill(true),
    timeScale: 1,
  };
  for (let i = 0; i < POOLS.enemies; i++) {
    view.enemies.push({
      visible: false,
      state: "inactive",
      pos: vec3(),
      yaw: 0,
      aimPoint: vec3(),
      stateProgress: 0,
      armed: false,
      walkDistance: 0,
    });
  }
  for (let i = 0; i < POOLS.bullets; i++) view.bullets.push({ active: false, pos: vec3(), vel: vec3(), origin: vec3() });
  for (let i = 0; i < POOLS.weapons; i++) view.weapons.push({ visible: false, heldByPlayer: false, holderId: NO_ID, pos: vec3(), angle: 0 });
  return view;
}

// Recopie l'état du jeu dans la vue, sans allocation.
export function writeGameView(game: Game, view: WorldView): void {
  const p = game.player;
  playerEye(game, view.camera.pos);
  view.camera.yaw = p.yaw;
  view.camera.pitch = p.pitch;
  view.timeScale = game.time.scale;
  for (let i = 0; i < game.enemies.length; i++) {
    const e = game.enemies[i]!;
    const v = view.enemies[i]!;
    v.visible = isAlive(e);
    v.state = e.state;
    copy(v.pos, e.pos);
    v.yaw = e.yaw;
    copy(v.aimPoint, e.aimPoint);
    const duration = stateDuration(e.state);
    v.stateProgress = duration > 0 ? Math.min(1, e.stateTime / duration) : 0;
    v.armed = e.weaponId !== NO_ID;
    v.walkDistance = e.walkDistance;
  }
  for (let i = 0; i < game.bullets.length; i++) {
    const b = game.bullets[i]!;
    const v = view.bullets[i]!;
    v.active = b.active;
    copy(v.pos, b.pos);
    copy(v.vel, b.vel);
    copy(v.origin, b.origin);
  }
  for (let i = 0; i < game.weapons.length; i++) {
    const w = game.weapons[i]!;
    const v = view.weapons[i]!;
    v.visible = w.state !== "free";
    v.heldByPlayer = w.state === "held" && w.holderId === PLAYER_ID;
    v.holderId = w.state === "held" ? w.holderId : NO_ID;
    copy(v.pos, w.pos);
    v.angle = w.angle;
  }
  const held = p.weaponId !== NO_ID ? game.weapons[p.weaponId] : undefined;
  view.playerAmmo = held ? held.ammo : -1;
  view.playerCooldown = p.fireCooldown;
  for (let i = 0; i < game.boxEnabled.length; i++) view.boxEnabled[i] = game.boxEnabled[i]!;
}

// Durée de l'état, en temps de simulation (0 : état sans fin programmée).
function stateDuration(state: EnemyState): number {
  switch (state) {
    case "aim":
      return ENEMY.aimTime;
    case "cooldown":
      return ENEMY.cooldown;
    case "stagger":
      return ENEMY.staggerTime;
    case "windup":
      return ENEMY.meleeWindup;
    default:
      return 0;
  }
}
