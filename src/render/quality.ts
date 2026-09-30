// Qualité de rendu (spec 4.5 et 9.2) : résolution adaptative et limite d'images par seconde. Calcul pur, testé avec bun.
//   auto  : 60 images/s au plus ; la résolution baisse par paliers si le temps d'image moyen dépasse 18 ms
//           pendant 2 s, et remonte d'un palier après 10 s stables ;
//   haute : pleine résolution, sans limite (jusqu'à la fréquence de l'écran, 120 sur un écran rapide) ;
//   basse : 60 images/s au plus, résolution fixe au dernier palier.
// La limite de 60 vient de l'essai de Romain au plan 2 : à 120 images/s en Retina, son Mac chauffait.

export type QualityMode = "auto" | "high" | "low";

export const QUALITY = {
  slowFrameMs: 18,
  slowWindow: 2,
  recoverWindow: 10,
  steps: [1, 0.85, 0.7],
  fpsCap: 60,
  // Au-delà (ms), un écart entre deux images est un arrêt (onglet caché, chargement), pas un GPU lent : ignoré.
  stallMs: 250,
  // Marge (ms) : une image de l'écran qui tombe un peu avant l'échéance compte quand même (écrans 120 et 144 Hz).
  capTolerance: 2,
} as const;

export class QualityGovernor {
  mode: QualityMode;
  private step = 0;
  private windowTime = 0;
  private windowFrames = 0;
  private windowMs = 0;
  private stableTime = 0;

  constructor(mode: QualityMode) {
    this.mode = mode;
    this.setMode(mode);
  }

  // Part de la résolution de base à utiliser (1 = pleine résolution).
  get scale(): number {
    return QUALITY.steps[this.step]!;
  }

  // Limite d'images par seconde, ou 0 sans limite.
  get fpsCap(): number {
    return this.mode === "high" ? 0 : QUALITY.fpsCap;
  }

  setMode(mode: QualityMode): void {
    this.mode = mode;
    this.step = mode === "low" ? QUALITY.steps.length - 1 : 0;
    this.resetWindow();
    this.stableTime = 0;
  }

  // Une image rendue : `frameMs` est l'écart avec la précédente. Renvoie vrai si l'échelle a changé.
  sample(frameMs: number): boolean {
    if (this.mode !== "auto" || frameMs > QUALITY.stallMs) return false;
    this.windowTime += frameMs / 1000;
    this.windowFrames++;
    this.windowMs += frameMs;
    if (this.windowTime < QUALITY.slowWindow) return false;
    const average = this.windowMs / this.windowFrames;
    const window = this.windowTime;
    this.resetWindow();
    if (average > QUALITY.slowFrameMs) {
      this.stableTime = 0;
      if (this.step < QUALITY.steps.length - 1) {
        this.step++;
        return true;
      }
      return false;
    }
    this.stableTime += window;
    if (this.stableTime >= QUALITY.recoverWindow && this.step > 0) {
      this.step--;
      this.stableTime = 0;
      return true;
    }
    return false;
  }

  private resetWindow(): void {
    this.windowTime = 0;
    this.windowFrames = 0;
    this.windowMs = 0;
  }
}

// Limite d'images par seconde : sur un écran plus rapide que la limite, on saute des images de l'écran.
export class FrameLimiter {
  private next = Number.NEGATIVE_INFINITY;

  // Vrai si l'image de l'écran à l'instant `now` (ms) doit être rendue, avec une limite `cap` (0 : aucune).
  shouldRender(now: number, cap: number): boolean {
    if (cap <= 0) return true;
    const interval = 1000 / cap;
    if (now < this.next - QUALITY.capTolerance) return false;
    // Échéance suivante calée sur la grille : pas de dérive vers le bas sur un écran à 144 Hz. Au départ, ou
    // après un long arrêt (onglet caché), on repart de maintenant.
    this.next = (now - this.next > interval ? now : this.next) + interval;
    return true;
  }
}
