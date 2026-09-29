// Bruitages 100 % synthétisés, 0 fichier (spec 7.3). Chaque fonction joue un son sur `out` à l'instant
// `when`, ralenti par `rate` (débit des SFX, spec 7.1) : fréquences × rate, durées ÷ rate.
import { Rng } from "../sim/rng";

export interface SfxKit {
  ctx: BaseAudioContext;
  // Bruit blanc d'une seconde, partagé.
  noise: AudioBuffer;
}

const rng = new Rng();

// Enveloppe : montée linéaire, descente exponentielle jusqu'au silence.
function envelope(kit: SfxKit, out: AudioNode, when: number, peak: number, attack: number, decay: number): GainNode {
  const g = new GainNode(kit.ctx, { gain: 0 });
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(peak, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + attack + decay);
  g.connect(out);
  return g;
}

// Rafale de bruit filtré.
function noiseBurst(
  kit: SfxKit,
  out: AudioNode,
  when: number,
  rate: number,
  type: BiquadFilterType,
  frequency: number,
  q: number,
  peak: number,
  duration: number,
): BiquadFilterNode {
  const src = new AudioBufferSourceNode(kit.ctx, { buffer: kit.noise, playbackRate: rate });
  const filter = new BiquadFilterNode(kit.ctx, { type, frequency: frequency * rate, Q: q });
  src.connect(filter).connect(envelope(kit, out, when, peak, 0.001, duration / rate));
  // Départ au hasard dans le bruit : deux tirs de suite ne sonnent pas identiques.
  src.start(when, Math.random() * 0.5, duration / rate + 0.05);
  return filter;
}

function tone(kit: SfxKit, out: AudioNode, when: number, type: OscillatorType, frequency: number, peak: number, attack: number, decay: number): OscillatorNode {
  const osc = new OscillatorNode(kit.ctx, { type, frequency });
  osc.connect(envelope(kit, out, when, peak, attack, decay));
  osc.start(when);
  osc.stop(when + attack + decay + 0.05);
  return osc;
}

// Tir : transitoire de 15 ms, coup grave entre 100 et 200 Hz, résonance métallique aiguë.
export function playShot(kit: SfxKit, out: AudioNode, when: number, rate: number): void {
  const k = 1 / rate;
  // Crêtes réglées pour que les trois couches ensemble restent autour de 1 (rendu hors ligne) ; le compresseur absorbe le reste.
  noiseBurst(kit, out, when, rate, "highpass", 2000, 0.7, 0.55, 0.015);
  const thump = tone(kit, out, when, "sine", 180 * rate, 0.6, 0.002, 0.18 * k);
  thump.frequency.setValueAtTime(180 * rate, when);
  thump.frequency.exponentialRampToValueAtTime(100 * rate, when + 0.12 * k);
  for (const partial of [2130, 3370, 5210]) tone(kit, out, when, "triangle", partial * rate, 0.05, 0.001, 0.25 * k);
}

// Clic à vide : double clic sec « tch-k », sans écho.
export function playDryFire(kit: SfxKit, out: AudioNode, when: number, rate: number): void {
  noiseBurst(kit, out, when, rate, "highpass", 3000, 0.7, 0.6, 0.004);
  noiseBurst(kit, out, when + 0.045 / rate, rate, "highpass", 4500, 0.7, 0.45, 0.004);
}

// Frôlement : bruit filtré autour de 3,2 kHz, dont la fréquence glisse vers le bas (effet Doppler).
export function playNearMiss(kit: SfxKit, out: AudioNode, when: number, rate: number): void {
  const k = 1 / rate;
  const filter = noiseBurst(kit, out, when, rate, "bandpass", 3200 * 1.35, 3, 0.8, 0.32);
  filter.frequency.setValueAtTime(3200 * 1.35 * rate, when);
  filter.frequency.exponentialRampToValueAtTime(3200 * 0.7 * rate, when + 0.3 * k);
}

// Impact d'une balle sur le décor : choc bref et mat.
export function playImpact(kit: SfxKit, out: AudioNode, when: number, rate: number): void {
  noiseBurst(kit, out, when, rate, "bandpass", 1200, 1.2, 0.35, 0.025);
}

// Éclatement : claquement de cristal, puis cascade de tintements. `seed` rend la cascade reproductible.
export function playShatter(kit: SfxKit, out: AudioNode, when: number, rate: number, seed: number): void {
  const k = 1 / rate;
  noiseBurst(kit, out, when, rate, "highpass", 2500, 0.7, 0.6, 0.04);
  rng.reset(seed);
  for (let i = 0; i < 12; i++) {
    const start = when + (0.02 + i * 0.05 + rng.range(0, 0.03)) * k;
    tone(kit, out, start, "sine", rng.range(2500, 7000) * rate, rng.range(0.05, 0.14), 0.002, rng.range(0.08, 0.25) * k);
  }
}

// Drone d'ambiance : 45 Hz modulé à 1,5 Hz. Joue en continu ; le volume se règle sur le gain renvoyé.
export function startDrone(kit: SfxKit, out: AudioNode): GainNode {
  const ctx = kit.ctx;
  const level = new GainNode(ctx, { gain: 0 });
  const tremolo = new GainNode(ctx, { gain: 0.6 });
  const lfo = new OscillatorNode(ctx, { type: "sine", frequency: 1.5 });
  const depth = new GainNode(ctx, { gain: 0.4 });
  lfo.connect(depth).connect(tremolo.gain);
  const fundamental = new OscillatorNode(ctx, { type: "sine", frequency: 45 });
  const octave = new OscillatorNode(ctx, { type: "sine", frequency: 90 });
  const octaveGain = new GainNode(ctx, { gain: 0.3 });
  fundamental.connect(tremolo);
  octave.connect(octaveGain).connect(tremolo);
  tremolo.connect(level).connect(out);
  lfo.start();
  fundamental.start();
  octave.start();
  return level;
}
