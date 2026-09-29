// Lecteur du replay : relit les échantillons à vitesse réelle (1 s de simulation = 1 s à l'écran).
import type { RoomDefinition } from "../rooms/types";
import { ENEMY, PLAYER, POOLS } from "../sim/entities";
import { shatterSeed } from "../sim/events";
import { ShatterSystem } from "../sim/shatter";
import { set, vec3 } from "../sim/vec3";
import { ENEMY_STATE_CODES, type WorldView, createWorldView } from "../sim/view";
import { EVENT_STRIDE, LAYOUT, RECORDED_EVENTS, type ReplayRecorder } from "./recorder";

const eventPos = vec3();
const eventVel = vec3();

export class ReplayPlayer {
  readonly shatter = new ShatterSystem();
  readonly view: WorldView;
  playhead = 0;
  private cursor = 0;
  private nextEvent = 0;
  private startTime = 0;
  private readonly recorder: ReplayRecorder;
  private readonly room: RoomDefinition;

  constructor(recorder: ReplayRecorder, room: RoomDefinition) {
    this.recorder = recorder;
    this.room = room;
    this.view = createWorldView(room.boxes.length, this.shatter.shards);
    this.restart();
  }

  get duration(): number {
    const r = this.recorder;
    return r.count < 2 ? 0 : r.timeOf(r.count - 1) - r.timeOf(0);
  }

  get finished(): boolean {
    return this.playhead >= this.duration;
  }

  restart(): void {
    this.playhead = 0;
    this.cursor = 0;
    this.nextEvent = 0;
    this.startTime = this.recorder.count > 0 ? this.recorder.timeOf(0) : 0;
    this.shatter.reset();
    this.view.boxEnabled.fill(true);
    // Les événements d'avant le premier échantillon conservé ne restaurent que l'état du décor (tampon plein).
    this.applyEventsUntil(this.startTime, false);
    this.writeView();
  }

  // Avance le replay de dtReal secondes réelles.
  update(dtReal: number): void {
    this.playhead = Math.min(this.duration, this.playhead + dtReal);
    this.applyEventsUntil(this.startTime + this.playhead, true);
    this.shatter.step(dtReal);
    this.writeView();
  }

  // `live` : false lors du redémarrage, où seuls les événements antérieurs à la fenêtre gardée
  // sont concernés et ne doivent pas faire jaillir d'éclats.
  private applyEventsUntil(time: number, live: boolean): void {
    const r = this.recorder;
    while (this.nextEvent < r.eventCount) {
      const o = this.nextEvent * EVENT_STRIDE;
      const t = r.events[o]!;
      if (t > time) break;
      const type = RECORDED_EVENTS[r.events[o + 1]!]!;
      const targetId = r.events[o + 2]!;
      set(eventPos, r.events[o + 3]!, r.events[o + 4]!, r.events[o + 5]!);
      set(eventVel, r.events[o + 6]!, r.events[o + 7]!, r.events[o + 8]!);
      // Une mort antérieure à la fenêtre gardée ne laisse rien à restaurer dans le décor.
      const spawn = live || t >= this.startTime;
      if (type === "rackBurst") {
        this.view.boxEnabled[targetId] = false;
        if (spawn) this.shatter.spawnBox(this.room.boxes[targetId]!, shatterSeed(1000 + targetId, t));
      } else if (spawn) {
        const player = type === "playerKilled";
        const height = player ? PLAYER.height : ENEMY.height;
        const radius = player ? PLAYER.radius : ENEMY.radius;
        this.shatter.spawnBody(eventPos, height, radius, eventVel, shatterSeed(targetId, t), player ? 2 : 0);
      }
      this.nextEvent++;
    }
  }

  // Interpole entre les deux échantillons qui encadrent la tête de lecture.
  private writeView(): void {
    const r = this.recorder;
    if (r.count === 0) return;
    const time = this.startTime + this.playhead;
    while (this.cursor < r.count - 2 && r.timeOf(this.cursor + 1) <= time) this.cursor++;
    const a = r.offsetOf(this.cursor);
    const b = r.offsetOf(Math.min(this.cursor + 1, r.count - 1));
    const s = r.samples;
    const ta = s[a + LAYOUT.time]!;
    const tb = s[b + LAYOUT.time]!;
    const t = tb > ta ? Math.min(1, Math.max(0, (time - ta) / (tb - ta))) : 0;
    const v = this.view;

    const ca = a + LAYOUT.camera;
    const cb = b + LAYOUT.camera;
    set(v.camera.pos, mix(s[ca]!, s[cb]!, t), mix(s[ca + 1]!, s[cb + 1]!, t), mix(s[ca + 2]!, s[cb + 2]!, t));
    v.camera.yaw = mixAngle(s[ca + 3]!, s[cb + 3]!, t);
    v.camera.pitch = mix(s[ca + 4]!, s[cb + 4]!, t);

    for (let i = 0; i < POOLS.enemies; i++) {
      const ka = a + LAYOUT.enemies + i * LAYOUT.enemyStride;
      const kb = b + LAYOUT.enemies + i * LAYOUT.enemyStride;
      const e = v.enemies[i]!;
      e.visible = s[ka] === 1;
      e.state = ENEMY_STATE_CODES[s[ka + 1]!] ?? "inactive";
      set(e.pos, mix(s[ka + 2]!, s[kb + 2]!, t), mix(s[ka + 3]!, s[kb + 3]!, t), mix(s[ka + 4]!, s[kb + 4]!, t));
      e.yaw = mixAngle(s[ka + 5]!, s[kb + 5]!, t);
      set(e.aimPoint, s[ka + 6]!, s[ka + 7]!, s[ka + 8]!);
      e.aimProgress = s[ka + 9]!;
    }
    for (let i = 0; i < POOLS.bullets; i++) {
      const ka = a + LAYOUT.bullets + i * LAYOUT.bulletStride;
      const kb = b + LAYOUT.bullets + i * LAYOUT.bulletStride;
      const bullet = v.bullets[i]!;
      bullet.active = s[ka] === 1;
      // Si la balle disparaît au prochain échantillon, on ne l'interpole pas vers une position périmée.
      const k = s[kb] === 1 ? t : 0;
      set(bullet.pos, mix(s[ka + 1]!, s[kb + 1]!, k), mix(s[ka + 2]!, s[kb + 2]!, k), mix(s[ka + 3]!, s[kb + 3]!, k));
      set(bullet.vel, s[ka + 4]!, s[ka + 5]!, s[ka + 6]!);
    }
    for (let i = 0; i < POOLS.weapons; i++) {
      const ka = a + LAYOUT.weapons + i * LAYOUT.weaponStride;
      const kb = b + LAYOUT.weapons + i * LAYOUT.weaponStride;
      const w = v.weapons[i]!;
      w.visible = s[ka] === 1;
      w.heldByPlayer = s[ka + 1] === 1;
      set(w.pos, mix(s[ka + 2]!, s[kb + 2]!, t), mix(s[ka + 3]!, s[kb + 3]!, t), mix(s[ka + 4]!, s[kb + 4]!, t));
      w.angle = mix(s[ka + 5]!, s[kb + 5]!, t);
    }
    v.playerAmmo = s[a + LAYOUT.misc]!;
    v.playerCooldown = s[a + LAYOUT.misc + 1]!;
    // Le replay se joue à vitesse réelle.
    v.timeScale = 1;
  }
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Interpolation d'angle par le plus court chemin.
function mixAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
