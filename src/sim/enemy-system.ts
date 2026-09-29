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
    const x0 = e.pos.x;
    const z0 = e.pos.z;
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
    updateStride(e, x0, z0, dt);
  }
}

// Amplitude de foulée : compare la position avant et après le déplacement du pas, puis lisse en temps de simulation.
function updateStride(e: Enemy, x0: number, z0: number, dt: number): void {
  const dx = e.pos.x - x0;
  const dz = e.pos.z - z0;
  const moved = dx * dx + dz * dz > ENEMY.strideMoveEpsilon * ENEMY.strideMoveEpsilon;
  e.strideAmp += ((moved ? 1 : 0) - e.strideAmp) * (1 - Math.exp(-ENEMY.strideRate * dt));
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

// Un coup de mêlée exige de se trouver à peu près à la même hauteur que le joueur, et une ligne de vue dégagée.
function canStrike(e: Enemy, player: Vec3, sight: boolean): boolean {
  return sight && Math.abs(player.y - e.pos.y) < ENEMY.meleeReachY;
}

function updateApproach(game: Game, e: Enemy, dt: number): void {
  const player = game.player.pos;
  faceTowards(e, player);
  const dist = Math.hypot(player.x - e.pos.x, player.z - e.pos.z);
  const sight = hasLineOfSight(game, e);
  const armed = e.weaponId !== NO_ID;
  if (armed && sight && distance(enemyEye, target) <= ENEMY.fireRange) {
    enterState(e, "aim");
    // Le trait de visée est juste dès la première image en état de visée.
    predictAim(game, e);
    return;
  }
  if (!armed && dist <= ENEMY.meleeRange && canStrike(e, player, sight)) {
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
  e.walkDistance += stepLen;
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

// Visée prédictive vers le torse du joueur, à la hauteur de sa posture du moment.
// Suppose `enemyEye` et `target` à jour (calculés par hasLineOfSight juste avant).
function predictAim(game: Game, e: Enemy): void {
  const p = game.player;
  const lead = distance(enemyEye, target) / BULLET.speed;
  const chestY = p.pos.y + (p.crouching ? PLAYER.crouchChest : PLAYER.chest);
  set(e.aimPoint, p.pos.x + p.vel.x * lead, chestY, p.pos.z + p.vel.z * lead);
}

function updateAim(game: Game, e: Enemy): void {
  faceTowards(e, game.player.pos);
  // Ligne de vue perdue, arme perdue ou joueur sorti de portée : la visée est annulée, sans tir.
  if (!hasLineOfSight(game, e) || e.weaponId === NO_ID || distance(enemyEye, target) > ENEMY.fireRange + 0.5) {
    enterState(e, "approach");
    return;
  }
  predictAim(game, e);
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
  if (dist <= ENEMY.meleeRange + PLAYER.radius && canStrike(e, p.pos, hasLineOfSight(game, e))) {
    normalize(hitVel, sub(hitVel, p.pos, e.pos));
    set(hitVel, hitVel.x * 4, 1, hitVel.z * 4);
    game.killPlayer(hitVel);
  }
  enterState(e, "cooldown");
}
