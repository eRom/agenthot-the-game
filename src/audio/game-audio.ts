// Son du jeu et du replay : lit la file d'événements et la vue du monde, comme le rendu.
import type { EventQueue } from "../sim/events";
import type { WorldView } from "../sim/view";
import { AudioEngine } from "./audio-engine";
import { playDryFire, playImpact, playNearMiss, playShatter, playShot, startDrone } from "./sfx";
import { AUDIO_TIME, droneGain, sfxRate } from "./time-coupling";

export class GameAudio {
  readonly engine = new AudioEngine();
  private readonly drone: GainNode;
  private timeScale = 1;

  constructor() {
    this.drone = startDrone(this.engine, this.engine.sfxIn);
  }

  unlock(): void {
    this.engine.unlock();
  }

  // Une image : l'auditeur suit la caméra, les filtres suivent le temps, les événements sonnent.
  frame(view: WorldView, events: EventQueue): void {
    const engine = this.engine;
    const cam = view.camera;
    this.timeScale = view.timeScale;
    engine.setListener(cam.pos.x, cam.pos.y, cam.pos.z, cam.yaw, cam.pitch);
    engine.setTimeScale(view.timeScale);
    this.drone.gain.setTargetAtTime(droneGain(view.timeScale), engine.ctx.currentTime, AUDIO_TIME.rampTime);
    this.play(events, view);
  }

  // Figé (mort, pause) : le son reste grave et étouffé, sans nouveaux événements.
  freeze(timeScale: number): void {
    this.timeScale = timeScale;
    this.engine.setTimeScale(timeScale);
    this.drone.gain.setTargetAtTime(droneGain(timeScale), this.engine.ctx.currentTime, AUDIO_TIME.rampTime);
  }

  private play(events: EventQueue, view: WorldView): void {
    const engine = this.engine;
    if (engine.ctx.state !== "running") return;
    const when = engine.ctx.currentTime;
    const rate = sfxRate(this.timeScale);
    const cam = view.camera.pos;
    for (let i = 0; i < events.count; i++) {
      const e = events.items[i]!;
      switch (e.type) {
        case "shot":
          playShot(engine, engine.spatial(e.pos.x, e.pos.y, e.pos.z), when, rate);
          break;
        case "dryFire":
          playDryFire(engine, engine.spatial(cam.x, cam.y, cam.z), when, rate);
          break;
        case "bulletImpact":
          playImpact(engine, engine.spatial(e.pos.x, e.pos.y, e.pos.z), when, rate);
          break;
        case "nearMiss":
          playNearMiss(engine, engine.spatial(e.pos.x, e.pos.y, e.pos.z), when, rate);
          break;
        case "enemyKilled":
        case "rackBurst":
          playShatter(engine, engine.spatial(e.pos.x, e.pos.y + 1, e.pos.z), when, rate, e.targetId + 1);
          break;
        case "playerKilled":
          // Vu de l'intérieur : le verre éclate sur l'auditeur.
          playShatter(engine, engine.spatial(cam.x, cam.y, cam.z), when, rate, 0);
          break;
        default:
          break;
      }
    }
  }
}
