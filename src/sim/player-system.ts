// Le joueur vit en temps réel : regard, déplacement, saut, actions (spec section 5.2).
import { ENEMY, NO_ID, PLAYER, PLAYER_ID, WEAPON, type Weapon, forwardFromAngles, isAlive } from "./entities";
import type { Game, PlayerInput } from "./game";
import { pushCircleOutOfAabbs, sweepSphereCapsule } from "./geometry";
import { addScaled, distance, set, vec3 } from "./vec3";

const forward = vec3();
const eye = vec3();
const chest = vec3();
const reach = vec3();
const punchVel = vec3();

export function eyeHeight(game: Game): number {
  return game.player.crouching ? PLAYER.eyeCrouch : PLAYER.eyeStand;
}

export function playerEye(game: Game, out = eye): typeof eye {
  const p = game.player;
  return set(out, p.pos.x, p.pos.y + eyeHeight(game), p.pos.z);
}

export function updatePlayer(game: Game, dtReal: number, input: PlayerInput): number {
  const p = game.player;

  // Regard : immédiat, jamais ralenti.
  p.yaw -= input.lookDX;
  p.pitch = Math.max(-PLAYER.maxPitch, Math.min(PLAYER.maxPitch, p.pitch - input.lookDY));

  p.crouching = input.crouch;
  if (input.jump && p.onGround) {
    p.vel.y = PLAYER.jumpSpeed;
    p.onGround = false;
  }

  const moveLen = Math.min(1, Math.hypot(input.moveX, input.moveZ));
  const acting = input.fire || (input.throw && p.weaponId !== NO_ID);
  const simDt = game.time.update(dtReal, {
    moveAlpha: moveLen,
    lookPixels: input.lookPixels,
    action: acting,
    jumpRising: !p.onGround && p.vel.y > 0,
  });

  // Déplacement horizontal dans le repère du regard (lacet seul).
  const sin = Math.sin(p.yaw);
  const cos = Math.cos(p.yaw);
  let mx = 0;
  let mz = 0;
  if (moveLen > 0) {
    const k = moveLen / Math.hypot(input.moveX, input.moveZ);
    const fx = input.moveZ * k;
    const sx = input.moveX * k;
    // Avant = (-sin, -cos), droite = (cos, -sin).
    mx = -sin * fx + cos * sx;
    mz = -cos * fx - sin * sx;
  }
  p.vel.x = mx * PLAYER.speed;
  p.vel.z = mz * PLAYER.speed;
  p.pos.x += p.vel.x * dtReal;
  p.pos.z += p.vel.z * dtReal;

  // Vertical : gravité réelle, sol à y = 0.
  if (!p.onGround) {
    p.vel.y -= PLAYER.gravity * dtReal;
    p.pos.y += p.vel.y * dtReal;
    if (p.pos.y <= 0) {
      p.pos.y = 0;
      p.vel.y = 0;
      p.onGround = true;
    }
  }
  const height = p.crouching ? PLAYER.crouchHeight : PLAYER.height;
  pushCircleOutOfAabbs(p.pos, PLAYER.radius, height, game.room.boxes, game.boxEnabled);

  // Le cooldown de tir compte en temps de simulation : il faut bouger pour recharger.
  p.fireCooldown = Math.max(0, p.fireCooldown - simDt);

  if (input.fire) fireOrPunch(game);
  if (input.throw) throwWeapon(game);
  if (input.use) pickUpNearest(game);
  catchFlyingWeapons(game);
  return simDt;
}

function fireOrPunch(game: Game): void {
  const p = game.player;
  playerEye(game);
  forwardFromAngles(forward, p.yaw, p.pitch);
  if (p.weaponId === NO_ID) {
    punch(game);
    return;
  }
  if (p.fireCooldown > 0) return;
  const w = game.weapons[p.weaponId]!;
  if (w.ammo <= 0) {
    game.events.push("dryFire", game.simTime, PLAYER_ID, NO_ID, eye);
    return;
  }
  w.ammo--;
  p.fireCooldown = PLAYER.fireCooldown;
  game.spawnBullet(eye, forward, PLAYER_ID);
}

function punch(game: Game): void {
  addScaled(reach, eye, forward, PLAYER.punchRange);
  game.events.push("punch", game.simTime, PLAYER_ID, NO_ID, eye);
  let best = -1;
  let bestT = 2;
  for (let i = 0; i < game.enemies.length; i++) {
    const e = game.enemies[i]!;
    if (!isAlive(e)) continue;
    const t = sweepSphereCapsule(eye, reach, 0.1, e.pos, ENEMY.height, ENEMY.radius);
    if (t >= 0 && t < bestT) {
      bestT = t;
      best = i;
    }
  }
  if (best < 0) return;
  const e = game.enemies[best]!;
  if (e.weaponId !== NO_ID && e.state !== "stagger") {
    game.staggerEnemy(e, game.player.pos);
  } else {
    set(punchVel, forward.x * 6, forward.y * 6, forward.z * 6);
    game.killEnemy(e, punchVel);
  }
}

function throwWeapon(game: Game): void {
  const p = game.player;
  if (p.weaponId === NO_ID) return;
  const w = game.weapons[p.weaponId]!;
  p.weaponId = NO_ID;
  playerEye(game);
  forwardFromAngles(forward, p.yaw, p.pitch);
  w.state = "flying";
  w.holderId = NO_ID;
  w.thrownBy = PLAYER_ID;
  w.bounced = false;
  w.flightTime = 0;
  addScaled(w.pos, eye, forward, 0.5);
  set(
    w.vel,
    forward.x * PLAYER.throwSpeed,
    forward.y * PLAYER.throwSpeed + PLAYER.throwLift,
    forward.z * PLAYER.throwSpeed,
  );
  game.events.push("weaponThrown", game.simTime, PLAYER_ID, w.id, w.pos, w.vel);
}

function pickUpNearest(game: Game): void {
  const p = game.player;
  set(chest, p.pos.x, p.pos.y + PLAYER.chest, p.pos.z);
  let best: Weapon | null = null;
  let bestDist: number = PLAYER.pickupRange;
  for (const w of game.weapons) {
    if (w.state !== "ground" && w.state !== "flying") continue;
    const d = distance(w.pos, chest);
    if (d <= bestDist) {
      bestDist = d;
      best = w;
    }
  }
  if (!best) return;
  if (p.weaponId !== NO_ID) {
    // On lâche l'arme tenue à ses pieds.
    const held = game.weapons[p.weaponId]!;
    held.state = "ground";
    held.holderId = NO_ID;
    set(held.pos, p.pos.x, WEAPON.radius, p.pos.z);
    p.weaponId = NO_ID;
  }
  game.giveWeapon(best, PLAYER_ID);
  game.events.push("weaponPicked", game.simTime, PLAYER_ID, best.id, best.pos);
}

// Une arme en vol qui touche le joueur les mains vides est captée d'office.
// Si plusieurs arrivent ensemble, il attrape la plus chargée.
function catchFlyingWeapons(game: Game): void {
  const p = game.player;
  if (p.weaponId !== NO_ID) return;
  set(chest, p.pos.x, p.pos.y + PLAYER.chest, p.pos.z);
  let best: Weapon | null = null;
  for (const w of game.weapons) {
    if (w.state !== "flying") continue;
    if (w.thrownBy === PLAYER_ID && w.flightTime < WEAPON.catchGrace) continue;
    if (distance(w.pos, chest) > PLAYER.catchRadius) continue;
    if (!best || w.ammo > best.ammo) best = w;
  }
  if (!best) return;
  game.giveWeapon(best, PLAYER_ID);
  game.events.push("weaponPicked", game.simTime, PLAYER_ID, best.id, best.pos);
}
