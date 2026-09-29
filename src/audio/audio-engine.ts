// Graphe Web Audio (spec 7.1) :
//   sources SFX ─► panner HRTF ─► bus SFX (passe-bas asservi) ────────────────┐
//   musique en jeu ─► passe-bas asservi et plafonné ─► gain de jeu (−12 dB) ─┼─► compresseur ─► sortie
//   musique menu / replay ────────────────────────────────────────────────────┘
// Le débit de la musique en jeu suit aussi le temps, côté MusicTrack.
import { AUDIO_TIME, gameMusicCutoff, lowpassCutoff } from "./time-coupling";

// Réglages par défaut de la spec 4.5 (volume musique 70, effets 90), appliqués au plan 3 par les paramètres.
const DEFAULT_MUSIC_VOLUME = 0.7;
const DEFAULT_SFX_VOLUME = 0.9;
// Musique de jeu à −12 dB sous celle du replay, qui garde son volume. Choix de Romain à l'essai de la
// tâche 9 (2026-09-29) : le son au ralenti « ne fait pas SUPERHOT », « Musique plus discrète ».
const GAME_MUSIC_GAIN = 0.25;

export class AudioEngine {
  readonly ctx: AudioContext;
  // Entrée des bruitages (après leur panner) : passe-bas asservi au temps.
  readonly sfxIn: GainNode;
  // Entrée de la musique en jeu : passe-bas des SFX plafonné (gameMusicCutoff), puis gain de jeu.
  readonly musicIn: GainNode;
  // Entrée de la musique du menu et du replay : jamais filtrée.
  readonly cleanMusicIn: GainNode;
  // Sortie commune, avant la destination : le plan 3 s'y branche pour enregistrer (?record=1).
  readonly master: DynamicsCompressorNode;
  // Une seconde de bruit blanc, générée une fois : matière première des bruitages.
  readonly noise: AudioBuffer;
  private readonly sfxFilter: BiquadFilterNode;
  private readonly musicFilter: BiquadFilterNode;
  private readonly sfxVolume: GainNode;
  private readonly musicVolume: GainNode;

  constructor() {
    this.ctx = new AudioContext({ latencyHint: "interactive" });
    const ctx = this.ctx;
    this.master = new DynamicsCompressorNode(ctx, { threshold: -12, knee: 12, ratio: 4, attack: 0.003, release: 0.25 });
    this.master.connect(ctx.destination);

    this.sfxVolume = new GainNode(ctx, { gain: DEFAULT_SFX_VOLUME });
    this.sfxFilter = new BiquadFilterNode(ctx, { type: "lowpass", frequency: lowpassCutoff(1), Q: 0.7 });
    this.sfxIn = new GainNode(ctx);
    this.sfxIn.connect(this.sfxFilter).connect(this.sfxVolume).connect(this.master);

    this.musicVolume = new GainNode(ctx, { gain: DEFAULT_MUSIC_VOLUME });
    this.musicFilter = new BiquadFilterNode(ctx, { type: "lowpass", frequency: gameMusicCutoff(1), Q: 0.7 });
    this.musicIn = new GainNode(ctx);
    const gameMusicTrim = new GainNode(ctx, { gain: GAME_MUSIC_GAIN });
    this.musicIn.connect(this.musicFilter).connect(gameMusicTrim).connect(this.musicVolume);
    this.cleanMusicIn = new GainNode(ctx);
    this.cleanMusicIn.connect(this.musicVolume);
    this.musicVolume.connect(this.master);

    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  // Le navigateur n'autorise le son qu'après un geste de l'utilisateur : à appeler dans un clic ou une touche.
  unlock(): void {
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setTimeScale(timeScale: number): void {
    const now = this.ctx.currentTime;
    this.sfxFilter.frequency.setTargetAtTime(lowpassCutoff(timeScale), now, AUDIO_TIME.rampTime);
    this.musicFilter.frequency.setTargetAtTime(gameMusicCutoff(timeScale), now, AUDIO_TIME.rampTime);
  }

  // Volumes de 0 à 1 (réglages du plan 3).
  setVolumes(music: number, sfx: number): void {
    const now = this.ctx.currentTime;
    this.musicVolume.gain.setTargetAtTime(music, now, AUDIO_TIME.rampTime);
    this.sfxVolume.gain.setTargetAtTime(sfx, now, AUDIO_TIME.rampTime);
  }

  // L'auditeur suit la caméra : position, regard (lacet 0 = −Z, tangage > 0 = vers le haut).
  setListener(x: number, y: number, z: number, yaw: number, pitch: number): void {
    const l = this.ctx.listener;
    const cp = Math.cos(pitch);
    const fx = -Math.sin(yaw) * cp;
    const fy = Math.sin(pitch);
    const fz = -Math.cos(yaw) * cp;
    if (l.positionX) {
      const now = this.ctx.currentTime;
      l.positionX.setValueAtTime(x, now);
      l.positionY.setValueAtTime(y, now);
      l.positionZ.setValueAtTime(z, now);
      l.forwardX.setValueAtTime(fx, now);
      l.forwardY.setValueAtTime(fy, now);
      l.forwardZ.setValueAtTime(fz, now);
      l.upX.setValueAtTime(0, now);
      l.upY.setValueAtTime(1, now);
      l.upZ.setValueAtTime(0, now);
    } else {
      // Navigateurs sans AudioParam sur l'auditeur : API historique.
      l.setPosition(x, y, z);
      l.setOrientation(fx, fy, fz, 0, 1, 0);
    }
  }

  // Un panner HRTF posé en (x, y, z), relié au bus SFX : un par bruitage (les sources Web Audio sont à usage unique).
  spatial(x: number, y: number, z: number): PannerNode {
    const panner = new PannerNode(this.ctx, {
      panningModel: "HRTF",
      distanceModel: "inverse",
      refDistance: 1.5,
      rolloffFactor: 1,
      positionX: x,
      positionY: y,
      positionZ: z,
    });
    panner.connect(this.sfxIn);
    return panner;
  }
}
