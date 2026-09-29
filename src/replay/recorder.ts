// Enregistreur du replay : échantillons de la vue à 60 Hz de temps de simulation (spec section 5.8).
import { POOLS } from "../sim/entities";
import type { EventQueue, GameEventType } from "../sim/events";
import { ENEMY_STATE_CODES, type WorldView } from "../sim/view";

export const REPLAY = {
  rateHz: 60,
  // 90 s de temps de simulation ; au-delà, on garde les 90 dernières secondes.
  capacity: 5400,
  eventCapacity: 64,
} as const;

// Disposition d'un échantillon dans le tableau plat.
export const LAYOUT = {
  time: 0,
  camera: 1, // x, y, z, yaw, pitch
  enemies: 6, // par ennemi : visible, state, x, y, z, yaw, aimX, aimY, aimZ, aimProgress
  enemyStride: 10,
  bullets: 6 + POOLS.enemies * 10, // par balle : active, x, y, z, vx, vy, vz
  bulletStride: 7,
  weapons: 6 + POOLS.enemies * 10 + POOLS.bullets * 7, // par arme : visible, held, x, y, z, angle
  weaponStride: 6,
  misc: 6 + POOLS.enemies * 10 + POOLS.bullets * 7 + POOLS.weapons * 6, // ammo, cooldown, timeScale
  stride: 6 + POOLS.enemies * 10 + POOLS.bullets * 7 + POOLS.weapons * 6 + 3,
} as const;

// Événements rejoués : ceux qui déclenchent des éclats ou changent le décor.
export const RECORDED_EVENTS: readonly GameEventType[] = ["enemyKilled", "playerKilled", "rackBurst"];
export const EVENT_STRIDE = 9; // time, typeIndex, targetId, x, y, z, vx, vy, vz

export class ReplayRecorder {
  readonly samples = new Float32Array(REPLAY.capacity * LAYOUT.stride);
  readonly events = new Float32Array(REPLAY.eventCapacity * EVENT_STRIDE);
  // Index du plus ancien échantillon et nombre d'échantillons valides (tampon circulaire).
  head = 0;
  count = 0;
  eventCount = 0;
  private nextSampleTime = 0;

  reset(): void {
    this.head = 0;
    this.count = 0;
    this.eventCount = 0;
    this.nextSampleTime = 0;
  }

  // À appeler après chaque pas de jeu. `force` enregistre même hors cadence (dernière image).
  capture(simTime: number, view: WorldView, force = false): void {
    if (!force && simTime < this.nextSampleTime) return;
    // Grille fixe à 60 Hz ; le rattrapage évite une rafale d'échantillons après une pause.
    this.nextSampleTime += 1 / REPLAY.rateHz;
    if (this.nextSampleTime <= simTime) this.nextSampleTime = simTime + 1 / REPLAY.rateHz;
    const slot = (this.head + this.count) % REPLAY.capacity;
    if (this.count < REPLAY.capacity) this.count++;
    else this.head = (this.head + 1) % REPLAY.capacity;
    writeSample(this.samples, slot * LAYOUT.stride, simTime, view);
  }

  recordEvents(queue: EventQueue): void {
    for (let i = 0; i < queue.count; i++) {
      const e = queue.items[i]!;
      const typeIndex = RECORDED_EVENTS.indexOf(e.type);
      if (typeIndex < 0) continue;
      const ev = this.events;
      // Tampon plein : on évince le plus ancien pour garder les événements récents, dans l'ordre.
      if (this.eventCount >= REPLAY.eventCapacity) {
        ev.copyWithin(0, EVENT_STRIDE, REPLAY.eventCapacity * EVENT_STRIDE);
        this.eventCount--;
      }
      const o = this.eventCount * EVENT_STRIDE;
      ev[o] = e.time;
      ev[o + 1] = typeIndex;
      ev[o + 2] = e.targetId;
      ev[o + 3] = e.pos.x;
      ev[o + 4] = e.pos.y;
      ev[o + 5] = e.pos.z;
      ev[o + 6] = e.vel.x;
      ev[o + 7] = e.vel.y;
      ev[o + 8] = e.vel.z;
      this.eventCount++;
    }
  }

  // Offset de l'échantillon n (0 = le plus ancien).
  offsetOf(n: number): number {
    return ((this.head + n) % REPLAY.capacity) * LAYOUT.stride;
  }

  timeOf(n: number): number {
    return this.samples[this.offsetOf(n) + LAYOUT.time]!;
  }
}

function writeSample(s: Float32Array, o: number, simTime: number, view: WorldView): void {
  s[o + LAYOUT.time] = simTime;
  const c = o + LAYOUT.camera;
  s[c] = view.camera.pos.x;
  s[c + 1] = view.camera.pos.y;
  s[c + 2] = view.camera.pos.z;
  s[c + 3] = view.camera.yaw;
  s[c + 4] = view.camera.pitch;
  for (let i = 0; i < POOLS.enemies; i++) {
    const e = view.enemies[i]!;
    const k = o + LAYOUT.enemies + i * LAYOUT.enemyStride;
    s[k] = e.visible ? 1 : 0;
    s[k + 1] = ENEMY_STATE_CODES.indexOf(e.state);
    s[k + 2] = e.pos.x;
    s[k + 3] = e.pos.y;
    s[k + 4] = e.pos.z;
    s[k + 5] = e.yaw;
    s[k + 6] = e.aimPoint.x;
    s[k + 7] = e.aimPoint.y;
    s[k + 8] = e.aimPoint.z;
    s[k + 9] = e.aimProgress;
  }
  for (let i = 0; i < POOLS.bullets; i++) {
    const b = view.bullets[i]!;
    const k = o + LAYOUT.bullets + i * LAYOUT.bulletStride;
    s[k] = b.active ? 1 : 0;
    s[k + 1] = b.pos.x;
    s[k + 2] = b.pos.y;
    s[k + 3] = b.pos.z;
    s[k + 4] = b.vel.x;
    s[k + 5] = b.vel.y;
    s[k + 6] = b.vel.z;
  }
  for (let i = 0; i < POOLS.weapons; i++) {
    const w = view.weapons[i]!;
    const k = o + LAYOUT.weapons + i * LAYOUT.weaponStride;
    s[k] = w.visible ? 1 : 0;
    s[k + 1] = w.heldByPlayer ? 1 : 0;
    s[k + 2] = w.pos.x;
    s[k + 3] = w.pos.y;
    s[k + 4] = w.pos.z;
    s[k + 5] = w.angle;
  }
  s[o + LAYOUT.misc] = view.playerAmmo;
  s[o + LAYOUT.misc + 1] = view.playerCooldown;
  s[o + LAYOUT.misc + 2] = view.timeScale;
}
