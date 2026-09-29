// Son du jeu et du replay : lit la file d'événements et la vue du monde, comme le rendu.
import type { EventQueue } from "../sim/events";
import type { WorldView } from "../sim/view";
import { AudioEngine } from "./audio-engine";
import { MusicTrack } from "./music";
import { playDryFire, playImpact, playNearMiss, playShatter, playShot, startDrone } from "./sfx";
import { AUDIO_TIME, droneGain, musicRate, sfxRate } from "./time-coupling";

// Morceaux Lyria (tâche 8 du plan 2), servis depuis public/audio/.
const MUSIC = {
  game: "/audio/game.mp3",
  replay: "/audio/replay.mp3",
} as const;

export class GameAudio {
  readonly engine = new AudioEngine();
  private readonly drone: GainNode;
  // Musique en jeu : filtrée et ralentie avec le temps. Musique du replay : à vitesse réelle, non filtrée.
  private readonly gameMusic: MusicTrack;
  private readonly replayMusic: MusicTrack;
  private timeScale = 1;
  // Vrai si c'est nous qui avons suspendu le contexte (onglet caché) : on ne reprend que dans ce cas,
  // jamais un contexte que le premier geste n'a pas encore débloqué.
  private suspendedByHidden = false;

  constructor() {
    this.drone = startDrone(this.engine, this.engine.sfxIn);
    this.gameMusic = new MusicTrack(this.engine.ctx, this.engine.musicIn, MUSIC.game);
    this.replayMusic = new MusicTrack(this.engine.ctx, this.engine.cleanMusicIn, MUSIC.replay);
  }

  loadMusic(): Promise<void> {
    return Promise.all([this.gameMusic.load(), this.replayMusic.load()]).then(() => undefined);
  }

  playGameMusic(): void {
    this.replayMusic.stop();
    this.gameMusic.play();
  }

  playReplayMusic(): void {
    this.gameMusic.stop();
    this.replayMusic.play();
  }

  unlock(): void {
    this.engine.unlock();
  }

  // Onglet caché : la boucle d'animation s'arrête, donc rien ne gèle plus la musique du replay (ni aucune
  // source en boucle). On suspend tout le contexte, et on le reprend au retour, seulement s'il tournait.
  setHidden(hidden: boolean): void {
    const ctx = this.engine.ctx;
    if (hidden) {
      if (ctx.state !== "running") return;
      this.suspendedByHidden = true;
      void ctx.suspend();
    } else if (this.suspendedByHidden) {
      this.suspendedByHidden = false;
      void ctx.resume();
    }
  }

  // Une image : l'auditeur suit la caméra, les filtres suivent le temps, les événements sonnent.
  frame(view: WorldView, events: EventQueue): void {
    const engine = this.engine;
    const cam = view.camera;
    this.timeScale = view.timeScale;
    engine.setListener(cam.pos.x, cam.pos.y, cam.pos.z, cam.yaw, cam.pitch);
    engine.setTimeScale(view.timeScale);
    this.gameMusic.setRate(musicRate(view.timeScale));
    this.drone.gain.setTargetAtTime(droneGain(view.timeScale), engine.ctx.currentTime, AUDIO_TIME.rampTime);
    this.play(events, view);
  }

  // Figé (mort, pause) : le son reste grave et étouffé, sans nouveaux événements.
  freeze(timeScale: number): void {
    this.timeScale = timeScale;
    this.engine.setTimeScale(timeScale);
    this.gameMusic.setRate(musicRate(timeScale));
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
