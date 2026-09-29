// Boucle de simulation d'une salle : ordonne les systèmes, porte l'état partagé.
import type { RoomDefinition } from "../rooms/types";
import { updateEnemies } from "./enemy-system";
import {
  BULLET,
  type Bullet,
  ENEMY,
  type Enemy,
  NO_ID,
  PLAYER,
  PLAYER_ID,
  POOLS,
  type Player,
  WEAPON,
  type Weapon,
  createBullet,
  createEnemy,
  createPlayer,
  createWeapon,
  isAlive,
} from "./entities";
import { EventQueue, shatterSeed } from "./events";
import { Navigator } from "./nav";
import { updatePlayer } from "./player-system";
import { updateBullets, updateWeapons } from "./projectile-system";
import { ShatterSystem } from "./shatter";
import { TimeController } from "./time";
import { type Vec3, copy, normalize, scale, set, sub, vec3 } from "./vec3";

export interface PlayerInput {
  // Déplacement voulu dans le repère du joueur, entre -1 et 1 (moveZ > 0 = avancer).
  moveX: number;
  moveZ: number;
  // Rotation de la caméra de l'image, en radians (sensibilité déjà appliquée).
  lookDX: number;
  lookDY: number;
  // Déplacement souris brut de l'image, en pixels (|dx| + |dy|), pour le temps.
  lookPixels: number;
  jump: boolean;
  crouch: boolean;
  // Vrais seulement à l'image de l'appui.
  fire: boolean;
  throw: boolean;
  use: boolean;
}

export function emptyInput(): PlayerInput {
  return {
    moveX: 0,
    moveZ: 0,
    lookDX: 0,
    lookDY: 0,
    lookPixels: 0,
    jump: false,
    crouch: false,
    fire: false,
    throw: false,
    use: false,
  };
}

export type GameStatus = "playing" | "dead" | "won";

const tmpDir = vec3();
const tmpBase = vec3();

export class Game {
  readonly time = new TimeController();
  readonly events = new EventQueue(128);
  readonly shatter = new ShatterSystem();
  readonly nav: Navigator;
  readonly player: Player = createPlayer();
  readonly enemies: Enemy[] = [];
  readonly weapons: Weapon[] = [];
  readonly bullets: Bullet[] = [];
  readonly boxEnabled: boolean[];
  status: GameStatus = "playing";
  simTime = 0;
  realTime = 0;
  // Apparitions pas encore déclenchées (indices dans room.spawns).
  private readonly pendingSpawns: boolean[];
  readonly room: RoomDefinition;

  constructor(room: RoomDefinition) {
    this.room = room;
    this.nav = new Navigator(room.nav);
    for (let i = 0; i < POOLS.enemies; i++) this.enemies.push(createEnemy(i + 1, room.nav.nodes.length));
    for (let i = 0; i < POOLS.weapons; i++) this.weapons.push(createWeapon(i));
    for (let i = 0; i < POOLS.bullets; i++) this.bullets.push(createBullet());
    this.boxEnabled = room.boxes.map(() => true);
    this.pendingSpawns = room.spawns.map(() => true);
    this.reset();
  }

  // Remet la salle à zéro sans rien allouer (relance en moins de 50 ms).
  reset(): void {
    const p = this.player;
    copy(p.pos, this.room.playerStart);
    set(p.vel, 0, 0, 0);
    p.yaw = this.room.playerYaw;
    p.pitch = 0;
    p.onGround = true;
    p.crouching = false;
    p.alive = true;
    p.weaponId = NO_ID;
    p.fireCooldown = 0;
    for (const e of this.enemies) e.state = "inactive";
    for (const w of this.weapons) w.state = "free";
    for (const b of this.bullets) b.active = false;
    for (let i = 0; i < this.boxEnabled.length; i++) this.boxEnabled[i] = true;
    for (let i = 0; i < this.pendingSpawns.length; i++) this.pendingSpawns[i] = true;
    this.shatter.reset();
    this.time.reset();
    this.events.clear();
    this.status = "playing";
    this.simTime = 0;
    this.realTime = 0;
    if (this.room.startWithWeapon) {
      const w = this.allocateWeapon();
      if (w) this.giveWeapon(w, PLAYER_ID);
    }
    this.triggerSpawns();
  }

  // Avance le jeu d'une image. Renvoie le pas de simulation utilisé.
  step(dtReal: number, input: PlayerInput): number {
    this.events.clear();
    if (this.status !== "playing") return 0;
    const simDt = updatePlayer(this, dtReal, input);
    this.simTime += simDt;
    this.realTime += dtReal;
    this.triggerSpawns();
    updateEnemies(this, simDt);
    updateWeapons(this, simDt);
    updateBullets(this, simDt);
    this.shatter.step(simDt);
    if (this.status === "playing" && this.allEnemiesDown()) this.status = "won";
    return simDt;
  }

  aliveEnemyCount(): number {
    let n = 0;
    for (const e of this.enemies) if (isAlive(e)) n++;
    return n;
  }

  // Une arme neuve (départ du joueur, apparition d'un ennemi) sort pleine.
  allocateWeapon(): Weapon | null {
    for (const w of this.weapons) {
      if (w.state !== "free") continue;
      w.ammo = WEAPON.capacity;
      return w;
    }
    return null;
  }

  // L'arme garde ses balles : une arme vidée puis reprise reste vide.
  giveWeapon(w: Weapon, holderId: number): void {
    w.state = "held";
    w.holderId = holderId;
    w.bounced = false;
    w.thrownBy = NO_ID;
    w.flightTime = 0;
    set(w.vel, 0, 0, 0);
    // L'arme apparaît dans la main de son porteur : jamais dessinée à l'origine avant le premier pas.
    if (holderId === PLAYER_ID) {
      this.player.weaponId = w.id;
      // Une arme prise est prête à tirer tout de suite (spec 5.4).
      this.player.fireCooldown = 0;
      set(w.pos, this.player.pos.x, this.player.pos.y + PLAYER.chest, this.player.pos.z);
    } else {
      const holder = this.enemies[holderId - 1]!;
      holder.weaponId = w.id;
      set(w.pos, holder.pos.x, holder.pos.y + ENEMY.handHeight, holder.pos.z);
    }
  }

  // Tire une balle depuis `origin` vers `dir` (normalisée).
  spawnBullet(origin: Vec3, dir: Vec3, ownerId: number): void {
    for (const b of this.bullets) {
      if (b.active) continue;
      b.active = true;
      b.ownerId = ownerId;
      b.life = 0;
      // Départ exact à l'origine : le tireur est exclu de ses balles par ownerId, et rien n'échappe au balayage.
      copy(b.pos, origin);
      scale(b.vel, dir, BULLET.speed);
      this.events.push("shot", this.simTime, ownerId, NO_ID, b.pos, b.vel);
      return;
    }
  }

  killEnemy(e: Enemy, impactVel: Vec3): void {
    if (!isAlive(e)) return;
    e.state = "dead";
    this.dropEnemyWeapon(e, e.pos, 0.3);
    this.events.push("enemyKilled", this.simTime, NO_ID, e.id, e.pos, impactVel);
    this.shatter.spawnBody(e.pos, ENEMY.height, ENEMY.radius, impactVel, shatterSeed(e.id, this.simTime), 0);
  }

  // Fait vaciller un ennemi : son arme saute vers `striker`.
  staggerEnemy(e: Enemy, striker: Vec3): void {
    if (!isAlive(e)) return;
    e.state = "stagger";
    e.stateTime = 0;
    this.dropEnemyWeapon(e, striker, ENEMY.ejectToward);
    this.events.push("enemyStaggered", this.simTime, NO_ID, e.id, e.pos);
  }

  killPlayer(impactVel: Vec3): void {
    const p = this.player;
    if (!p.alive) return;
    p.alive = false;
    this.status = "dead";
    this.events.push("playerKilled", this.simTime, NO_ID, PLAYER_ID, p.pos, impactVel);
    this.shatter.spawnBody(p.pos, PLAYER.height, PLAYER.radius, impactVel, shatterSeed(PLAYER_ID, this.simTime), 2);
  }

  private dropEnemyWeapon(e: Enemy, toward: Vec3, horizontalSpeed: number): void {
    if (e.weaponId === NO_ID) return;
    const w = this.weapons[e.weaponId]!;
    e.weaponId = NO_ID;
    w.state = "flying";
    w.holderId = NO_ID;
    w.thrownBy = NO_ID;
    w.bounced = false;
    w.flightTime = 0;
    set(w.pos, e.pos.x, e.pos.y + ENEMY.handHeight, e.pos.z);
    sub(tmpDir, toward, e.pos);
    tmpDir.y = 0;
    normalize(tmpDir, tmpDir);
    set(w.vel, tmpDir.x * horizontalSpeed, ENEMY.ejectUp, tmpDir.z * horizontalSpeed);
  }

  // Apparitions du départ d'abord, puis celles qui attendent « il reste n ennemis ».
  private triggerSpawns(): void {
    const spawns = this.room.spawns;
    for (let i = 0; i < spawns.length; i++) {
      if (this.pendingSpawns[i] && spawns[i]!.trigger.kind === "start") this.spawnEnemy(i);
    }
    const alive = this.aliveEnemyCount();
    for (let i = 0; i < spawns.length; i++) {
      const trigger = spawns[i]!.trigger;
      if (this.pendingSpawns[i] && trigger.kind === "remaining" && alive <= trigger.count) this.spawnEnemy(i);
    }
  }

  private spawnEnemy(spawnIndex: number): void {
    const spawn = this.room.spawns[spawnIndex]!;
    let e: Enemy | undefined;
    for (const candidate of this.enemies) {
      if (candidate.state === "inactive") {
        e = candidate;
        break;
      }
    }
    if (!e) return;
    this.pendingSpawns[spawnIndex] = false;
    copy(e.pos, spawn.pos);
    // Pas de trait de visée périmé (ou à l'origine) avant la première visée.
    copy(e.aimPoint, e.pos);
    e.yaw = spawn.yaw;
    e.mobile = spawn.mobile;
    e.state = "approach";
    e.stateTime = 0;
    e.weaponId = NO_ID;
    e.pathLength = 0;
    e.pathIndex = 0;
    e.repathTimer = 0;
    if (spawn.armed) {
      const w = this.allocateWeapon();
      if (w) this.giveWeapon(w, e.id);
    }
    if (spawn.burstBoxIndex !== undefined) {
      this.boxEnabled[spawn.burstBoxIndex] = false;
      const box = this.room.boxes[spawn.burstBoxIndex]!;
      set(tmpBase, (box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2);
      this.events.push("rackBurst", this.simTime, NO_ID, spawn.burstBoxIndex, tmpBase);
      this.shatter.spawnBox(box, shatterSeed(1000 + spawn.burstBoxIndex, this.simTime));
    }
    this.events.push("enemySpawned", this.simTime, NO_ID, e.id, e.pos);
  }

  private allEnemiesDown(): boolean {
    for (const pending of this.pendingSpawns) if (pending) return false;
    return this.aliveEnemyCount() === 0;
  }
}
