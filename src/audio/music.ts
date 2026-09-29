// Une piste musicale en boucle (spec 7.2). La musique en jeu suit le temps par son débit, sans
// correction de hauteur : un AudioBufferSourceNode ralenti descend dans le grave (spec 7.1).
import { AUDIO_TIME } from "./time-coupling";

export class MusicTrack {
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private readonly ctx: BaseAudioContext;
  private readonly out: AudioNode;
  private readonly url: string;

  constructor(ctx: BaseAudioContext, out: AudioNode, url: string) {
    this.ctx = ctx;
    this.out = out;
    this.url = url;
  }

  // Charge le fichier. Absent ou illisible (musique pas encore générée) : le jeu reste muet, sans erreur.
  async load(): Promise<void> {
    try {
      const response = await fetch(this.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.buffer = await this.ctx.decodeAudioData(await response.arrayBuffer());
    } catch (error) {
      console.warn(`[agenthot] music ${this.url} unavailable`, error);
    }
  }

  get loaded(): boolean {
    return this.buffer !== null;
  }

  // Repart du début, en boucle.
  play(): void {
    this.stop();
    if (!this.buffer) return;
    this.source = new AudioBufferSourceNode(this.ctx, { buffer: this.buffer, loop: true });
    this.source.connect(this.out);
    this.source.start();
  }

  stop(): void {
    if (!this.source) return;
    this.source.stop();
    this.source.disconnect();
    this.source = null;
  }

  setRate(rate: number): void {
    this.source?.playbackRate.setTargetAtTime(rate, this.ctx.currentTime, AUDIO_TIME.rampTime);
  }
}
