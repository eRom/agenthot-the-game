// Contrôleur du temps : « le temps n'avance que quand tu bouges » (spec section 5.1).

export const TIME = {
  min: 0.03,
  lookWeight: 0.1,
  // Vitesse souris (pixels par seconde réelle) qui compte comme « regard plein ».
  lookThreshold: 800,
  // Décroissance du coup d'accélération : e^(-15 × 0,2 s) ≈ 5 % au bout de 0,2 s.
  actionDecayRate: 15,
  // Montée douce pour laisser le temps de planifier, arrêt net pour figer vite.
  smoothingUp: 5,
  smoothingDown: 12,
  maxSimDt: 1 / 60,
} as const;

export interface TimeInput {
  // Vitesse horizontale voulue du joueur divisée par sa vitesse max, entre 0 et 1.
  moveAlpha: number;
  // Déplacement souris de l'image, en pixels (|dx| + |dy|).
  lookPixels: number;
  // Vrai à l'image où le joueur tire, frappe ou lance.
  action: boolean;
  // Vrai pendant la phase montante d'un saut.
  jumpRising: boolean;
}

export class TimeController {
  scale: number = TIME.min;
  private actionAlpha = 0;

  reset(): void {
    this.scale = TIME.min;
    this.actionAlpha = 0;
  }

  // Met à jour l'échelle et renvoie le pas de simulation de l'image.
  update(dtReal: number, input: TimeInput): number {
    if (input.action) this.actionAlpha = 1;
    else this.actionAlpha *= Math.exp(-TIME.actionDecayRate * dtReal);

    const lookRate = dtReal > 0 ? input.lookPixels / dtReal : 0;
    const lookAlpha = Math.min(1, lookRate / TIME.lookThreshold) * TIME.lookWeight;

    let raw = input.moveAlpha + lookAlpha + this.actionAlpha;
    raw = Math.min(1, Math.max(TIME.min, raw));
    if (input.jumpRising) raw = 1;

    const smoothing = raw > this.scale ? TIME.smoothingUp : TIME.smoothingDown;
    this.scale += (raw - this.scale) * (1 - Math.exp(-smoothing * dtReal));
    return Math.min(dtReal * this.scale, TIME.maxSimDt);
  }
}
