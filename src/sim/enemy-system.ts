// Comportement des ennemis, en temps de simulation (spec section 5.6).
import { BULLET, ENEMY, type Enemy, NO_ID, PLAYER, isAlive } from "./entities";
import type { Game } from "./game";
import { pushCircleOutOfAabbs, segmentBlocked } from "./geometry";
import { playerEye } from "./player-system";
import { type Vec3, distance, normalize, set, sub, vec3 } from "./vec3";

const enemyEye = vec3();
const target = vec3();
const muzzle = vec3();
const dir = vec3();
const hitVel = vec3();

export function updateEnemies(game: Game, dt: number): void {
  if (dt <= 0) return;
  playerEye(game, target);
  for (const e of game.enemies) {
    if (!isAlive(e)) continue;
    e.stateTime += dt;
    switch (e.state) {
      case "stagger":
        if (e.stateTime >= ENEMY.staggerTime) enterState(e, "approach");
        break;
      case "cooldown":
        if (e.stateTime >= ENEMY.cooldown) enterState(e, "approach");
        break;
      case "windup":
        updateWindup(game, e);
        break;
      case "aim":
        updateAim(game, e);
        break;
      case "approach":
        updateApproach(game, e, dt);
        break;
      default:
        break;
    }
  }
}

function enterState(e: Enemy, state: Enemy["state"]): void {
  e.state = state;
  e.stateTime = 0;
}

function faceTowards(e: Enemy, p: Vec3): void {
  // Lacet 0 = -Z : yaw = atan2(-dx, -dz).
  e.yaw = Math.atan2(-(p.x - e.pos.x), -(p.z - e.pos.z));
}

function hasLineOfSight(game: Game, e: Enemy): boolean {
  set(enemyEye, e.pos.x, e.pos.y + ENEMY.eyeHeight, e.pos.z);
  return !segmentBlocked(enemyEye, target, game.room.boxes, game.boxEnabled);
}

function updateApproach(game: Game, e: Enemy, dt: number): void {
  const player = game.player.pos;
  faceTowards(e, player);
  const dist = Math.hypot(player.x - e.pos.x, player.z - e.pos.z);
  const sight = hasLineOfSight(game, e);
  const armed = e.weaponId !== NO_ID;
  if (armed && sight && distance(enemyEye, target) <= ENEMY.fireRange) {
    enterState(e, "aim");
    return;
  }
  if (!armed && dist <= ENEMY.meleeRange) {
    enterState(e, "windup");
    return;
  }
  if (!e.mobile) return;
  if (sight) {
    moveTowards(e, player, dt);
  } else {
    followPath(game, e, dt);
  }
  pushCircleOutOfAabbs(e.pos, ENEMY.radius, ENEMY.height, game.room.boxes, game.boxEnabled);
}

function moveTowards(e: Enemy, p: Vec3, dt: number): void {
  const dx = p.x - e.pos.x;
  const dz = p.z - e.pos.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) return;
  const stepLen = Math.min(len, ENEMY.speed * dt);
  e.pos.x += (dx / len) * stepLen;
  e.pos.z += (dz / len) * stepLen;
}

function followPath(game: Game, e: Enemy, dt: number): void {
  e.repathTimer -= dt;
  if (e.repathTimer <= 0 || e.pathIndex >= e.pathLength) {
    e.pathLength = game.nav.findPath(e.pos, game.player.pos, e.path);
    e.pathIndex = 0;
    e.repathTimer = ENEMY.repathInterval;
  }
  if (e.pathIndex >= e.pathLength) return;
  const node = game.nav.graph.nodes[e.path[e.pathIndex]!]!;
  moveTowards(e, node, dt);
  if (Math.hypot(node.x - e.pos.x, node.z - e.pos.z) < ENEMY.waypointReach) e.pathIndex++;
}

function updateAim(game: Game, e: Enemy): void {
  const p = game.player;
  faceTowards(e, p.pos);
  if (!hasLineOfSight(game, e) || e.weaponId === NO_ID) {
    enterState(e, "approach");
    return;
  }
  // Visée prédictive vers le torse du joueur.
  const lead = distance(enemyEye, target) / BULLET.speed;
  set(e.aimPoint, p.pos.x + p.vel.x * lead, p.pos.y + PLAYER.chest, p.pos.z + p.vel.z * lead);
  if (e.stateTime < ENEMY.aimTime) return;
  set(muzzle, e.pos.x, e.pos.y + ENEMY.muzzleHeight, e.pos.z);
  normalize(dir, sub(dir, e.aimPoint, muzzle));
  game.spawnBullet(muzzle, dir, e.id);
  enterState(e, "cooldown");
}

function updateWindup(game: Game, e: Enemy): void {
  const p = game.player;
  faceTowards(e, p.pos);
  if (e.stateTime < ENEMY.meleeWindup) return;
  const dist = Math.hypot(p.pos.x - e.pos.x, p.pos.z - e.pos.z);
  if (dist <= ENEMY.meleeRange + PLAYER.radius) {
    normalize(hitVel, sub(hitVel, p.pos, e.pos));
    set(hitVel, hitVel.x * 4, 1, hitVel.z * 4);
    game.killPlayer(hitVel);
  }
  enterState(e, "cooldown");
}
