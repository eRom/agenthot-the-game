// Balles (détection de collision continue) et armes en vol (spec sections 5.3 et 5.4).
import { BULLET, ENEMY, NO_ID, PLAYER, PLAYER_ID, WEAPON, isAlive } from "./entities";
import type { Game } from "./game";
import { sweepSphereAabb, sweepSphereCapsule } from "./geometry";
import { addScaled, copy, lerp, set, vec3 } from "./vec3";

const next = vec3();
const hit = vec3();

const HIT_NONE = 0;
const HIT_BOX = 1;
const HIT_ENEMY = 2;
const HIT_PLAYER = 3;

export function updateBullets(game: Game, dt: number): void {
  if (dt <= 0) return;
  const boxes = game.room.boxes;
  const player = game.player;
  for (const b of game.bullets) {
    if (!b.active) continue;
    b.life += dt;
    if (b.life > BULLET.maxLife) {
      b.active = false;
      continue;
    }
    addScaled(next, b.pos, b.vel, dt);
    let bestT = 2;
    let kind = HIT_NONE;
    let targetIndex = -1;
    for (let i = 0; i < boxes.length; i++) {
      if (!game.boxEnabled[i]) continue;
      const t = sweepSphereAabb(b.pos, next, BULLET.radius, boxes[i]!);
      if (t >= 0 && t < bestT) {
        bestT = t;
        kind = HIT_BOX;
        targetIndex = i;
      }
    }
    for (let i = 0; i < game.enemies.length; i++) {
      const e = game.enemies[i]!;
      if (!isAlive(e) || e.id === b.ownerId) continue;
      const t = sweepSphereCapsule(b.pos, next, BULLET.radius, e.pos, ENEMY.height, ENEMY.radius);
      if (t >= 0 && t < bestT) {
        bestT = t;
        kind = HIT_ENEMY;
        targetIndex = i;
      }
    }
    if (player.alive && b.ownerId !== PLAYER_ID) {
      const height = player.crouching ? PLAYER.crouchHeight : PLAYER.height;
      const t = sweepSphereCapsule(b.pos, next, BULLET.radius, player.pos, height, PLAYER.radius);
      if (t >= 0 && t < bestT) {
        bestT = t;
        kind = HIT_PLAYER;
      }
    }
    if (kind === HIT_NONE) {
      copy(b.pos, next);
      continue;
    }
    lerp(hit, b.pos, next, bestT);
    copy(b.pos, hit);
    b.active = false;
    if (kind === HIT_BOX) {
      game.events.push("bulletImpact", game.simTime, b.ownerId, targetIndex, hit, b.vel);
    } else if (kind === HIT_ENEMY) {
      game.killEnemy(game.enemies[targetIndex]!, b.vel);
    } else {
      game.killPlayer(b.vel);
    }
  }
}

export function updateWeapons(game: Game, dt: number): void {
  if (dt <= 0) return;
  const boxes = game.room.boxes;
  for (const w of game.weapons) {
    if (w.state === "held") {
      followHolder(game, w.holderId, w.pos);
      continue;
    }
    if (w.state !== "flying") continue;
    w.flightTime += dt;
    w.vel.y -= WEAPON.gravity * dt;
    w.angle += WEAPON.spin * dt;
    addScaled(next, w.pos, w.vel, dt);

    // Une arme lancée par le joueur fait vaciller le premier ennemi touché.
    if (w.thrownBy === PLAYER_ID && !w.bounced) {
      for (const e of game.enemies) {
        if (!isAlive(e)) continue;
        const t = sweepSphereCapsule(w.pos, next, WEAPON.radius, e.pos, ENEMY.height, ENEMY.radius);
        if (t < 0) continue;
        lerp(next, w.pos, next, t);
        game.staggerEnemy(e, game.player.pos);
        // L'arme lancée tombe aux pieds de l'ennemi : c'est la sienne qui vole vers le joueur.
        set(w.vel, 0, 1, 0);
        w.bounced = true;
        break;
      }
    }

    for (let i = 0; i < boxes.length; i++) {
      if (!game.boxEnabled[i]) continue;
      const t = sweepSphereAabb(w.pos, next, WEAPON.radius, boxes[i]!);
      if (t < 0) continue;
      const box = boxes[i]!;
      lerp(next, w.pos, next, t);
      // Arrivée par le dessus (passerelle, haut d'une baie) : l'arme se pose.
      if (w.pos.y >= box.max.y) {
        next.y = box.max.y + WEAPON.radius;
        set(w.vel, 0, 0, 0);
        w.state = "ground";
        w.thrownBy = NO_ID;
        break;
      }
      // Rebond simple : on renverse l'horizontale, une seule fois.
      w.vel.x = -w.vel.x * WEAPON.bounceDamping;
      w.vel.z = -w.vel.z * WEAPON.bounceDamping;
      if (w.bounced) {
        w.vel.x = 0;
        w.vel.z = 0;
      }
      w.bounced = true;
      break;
    }
    copy(w.pos, next);

    if (w.pos.y <= WEAPON.radius) {
      w.pos.y = WEAPON.radius;
      set(w.vel, 0, 0, 0);
      w.state = "ground";
      w.thrownBy = NO_ID;
    }
  }
}

function followHolder(game: Game, holderId: number, out: typeof hit): void {
  if (holderId === PLAYER_ID) {
    const p = game.player;
    set(out, p.pos.x, p.pos.y + PLAYER.chest, p.pos.z);
    return;
  }
  const e = game.enemies[holderId - 1];
  if (e) set(out, e.pos.x, e.pos.y + ENEMY.handHeight, e.pos.z);
}
