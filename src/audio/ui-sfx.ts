// Sons d'interface du menu (spec 4.3 et 7.3) : survol, validation, retour. Synthétisés, courts, secs, « tech ».
import type { SfxKit } from "./sfx";

export type UiSound = "hover" | "select" | "back";

// Petit bip à enveloppe rapide, avec glissement de fréquence de `from` à `to` Hz.
function blip(kit: SfxKit, out: AudioNode, when: number, type: OscillatorType, from: number, to: number, peak: number, duration: number): void {
  const osc = new OscillatorNode(kit.ctx, { type, frequency: from });
  osc.frequency.setValueAtTime(from, when);
  osc.frequency.exponentialRampToValueAtTime(to, when + duration);
  const g = new GainNode(kit.ctx, { gain: 0 });
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(peak, when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(g).connect(out);
  osc.start(when);
  osc.stop(when + duration + 0.02);
}

// Clic de bruit très court, filtré haut : l'attaque « mécanique » d'une touche.
function tick(kit: SfxKit, out: AudioNode, when: number, frequency: number, peak: number): void {
  const src = new AudioBufferSourceNode(kit.ctx, { buffer: kit.noise });
  const filter = new BiquadFilterNode(kit.ctx, { type: "bandpass", frequency, Q: 1.4 });
  const g = new GainNode(kit.ctx, { gain: 0 });
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(peak, when + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.012);
  src.connect(filter).connect(g).connect(out);
  src.start(when, 0, 0.03);
}

export function playUiSound(kit: SfxKit, out: AudioNode, when: number, sound: UiSound): void {
  switch (sound) {
    case "hover":
      // Survol : un tic sec et un bip aigu très bref.
      tick(kit, out, when, 5200, 0.25);
      blip(kit, out, when, "square", 2400, 2100, 0.035, 0.03);
      break;
    case "select":
      // Validation : deux bips qui montent, sur un petit coup grave.
      tick(kit, out, when, 4200, 0.3);
      blip(kit, out, when, "triangle", 880, 990, 0.22, 0.06);
      blip(kit, out, when + 0.055, "triangle", 1320, 1480, 0.2, 0.09);
      blip(kit, out, when, "sine", 140, 70, 0.45, 0.09);
      break;
    case "back":
      // Retour : un bip qui descend.
      tick(kit, out, when, 3600, 0.22);
      blip(kit, out, when, "triangle", 1180, 620, 0.2, 0.1);
      break;
  }
}
