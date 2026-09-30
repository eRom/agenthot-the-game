// Une piste musicale en boucle (spec 7.2). La musique en jeu suit le temps par son débit, sans
// correction de hauteur : un AudioBufferSourceNode ralenti descend dans le grave (spec 7.1).
import { AUDIO_TIME } from "./time-coupling";

export type TrackName = "game" | "replay" | "menu";

export interface MusicPlayback {
  // Où la lecture démarre dans le fichier (s).
  offset: number;
  // Fenêtre de la boucle (s) : le son revient de loopEnd à loopStart.
  loopStart: number;
  loopEnd: number;
}

// Mesure d'une boucle coupée sur le temps (bun scripts/measure-loop.ts) : premier temps fort après le silence de
// tête, durée d'une mesure et début du silence de fin, en secondes.
export interface BarMeasure {
  firstDownbeat: number;
  barSeconds: number;
  tailSilenceStart: number;
}

// Avance de la coupe sur le temps fort (s) : le pointage des temps est à ±23 ms près ; couper un peu avant ne mange
// pas l'attaque de la grosse caisse, et la fin de boucle, décalée d'autant, garde la même phase.
const BAR_LOOP_LEAD = 0.03;

// Boucle d'un nombre entier de mesures, qui démarre juste avant un temps fort : la jointure tombe sur le temps. Le
// tempo est mesuré, jamais supposé : Lyria ne tient pas le BPM demandé (game.mp3, demandé à 120, mesuré à 130).
export function barLoop(m: BarMeasure): MusicPlayback {
  const loopStart = Math.max(0, m.firstDownbeat - BAR_LOOP_LEAD);
  const bars = Math.floor((m.tailSilenceStart - loopStart) / m.barSeconds);
  return { offset: loopStart, loopStart, loopEnd: loopStart + bars * m.barSeconds };
}

// Boucle du menu : src/audio/tracks/menu.mp3, mesurée le 2026-09-30 par bun scripts/measure-loop.ts (plan 3b, tâche 6).
export const MENU_LOOP: BarMeasure = { firstDownbeat: 0.093, barSeconds: 1.875128, tailSilenceStart: 62.575034 };

// Les morceaux Lyria portent du silence : `game` 2,57 s à la fin, `replay` 2,69 s au début et 2,34 s à la fin.
// Mesures du 2026-09-29 (seuil -50 dB, durée minimale 0,5 s) :
//   ffmpeg -i src/audio/tracks/<piste>.mp3 -af silencedetect=noise=-50dB:d=0.5 -f null -
//   game   : silence_start 89.1435 -> fin (91.7159)
//   replay : silence 0 -> 2.6918, puis silence_start 103.0595 -> fin (105.4040)
// Valeurs arrondies vers l'intérieur du son (au plus 10 ms de musique sacrifiés).
const PLAYBACK: Record<TrackName, MusicPlayback> = {
  game: { offset: 0, loopStart: 0, loopEnd: 89.14 },
  replay: { offset: 2.69, loopStart: 2.69, loopEnd: 103.05 },
  // Boucle du menu : un nombre entier de mesures, calé sur le temps (MENU_LOOP).
  menu: barLoop(MENU_LOOP),
};

// Paramètres de lecture d'une piste, bornés à la durée du tampon décodé : une piste régénérée plus courte
// ne fait jamais sortir la boucle de son fichier (sans quoi Web Audio ignorerait la fenêtre en silence).
export function musicPlayback(name: TrackName, bufferDuration: number): MusicPlayback {
  const table = PLAYBACK[name];
  const loopEnd = Math.min(table.loopEnd, bufferDuration);
  if (table.loopStart >= loopEnd) return { offset: 0, loopStart: 0, loopEnd: bufferDuration };
  return { offset: table.offset, loopStart: table.loopStart, loopEnd };
}

export class MusicTrack {
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  // Lecture demandée avant la fin du décodage : elle démarre dès que le morceau est prêt.
  private pending = false;
  private readonly ctx: BaseAudioContext;
  private readonly out: AudioNode;
  private readonly url: string;
  private readonly name: TrackName;

  constructor(ctx: BaseAudioContext, out: AudioNode, url: string, name: TrackName) {
    this.ctx = ctx;
    this.out = out;
    this.url = url;
    this.name = name;
  }

  // Charge le fichier. Absent ou illisible (musique pas encore générée) : le jeu reste muet, sans erreur.
  async load(): Promise<void> {
    try {
      const response = await fetch(this.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.buffer = await this.ctx.decodeAudioData(await response.arrayBuffer());
      if (this.pending) this.play();
    } catch (error) {
      console.warn(`[agenthot] music ${this.url} unavailable`, error);
    }
  }

  get loaded(): boolean {
    return this.buffer !== null;
  }

  // Repart du début du son (après le silence de tête), en boucle sur la fenêtre sans silence.
  play(): void {
    this.stop();
    if (!this.buffer) {
      this.pending = true;
      return;
    }
    const { offset, loopStart, loopEnd } = musicPlayback(this.name, this.buffer.duration);
    this.source = new AudioBufferSourceNode(this.ctx, { buffer: this.buffer, loop: true, loopStart, loopEnd });
    this.source.connect(this.out);
    this.source.start(0, offset);
  }

  stop(): void {
    this.pending = false;
    if (!this.source) return;
    this.source.stop();
    this.source.disconnect();
    this.source = null;
  }

  setRate(rate: number): void {
    this.source?.playbackRate.setTargetAtTime(rate, this.ctx.currentTime, AUDIO_TIME.rampTime);
  }
}
