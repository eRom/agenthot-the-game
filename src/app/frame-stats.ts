// Sonde AC-8 (debug seulement) : l'intervalle entre deux images rendues et leurs appels de dessin, gardés dans un
// anneau pré-alloué. Rien n'est alloué par image ; le rapport, lui, se calcule après coup, hors de la boucle
// (window.agenthot.frameStats()).

export const FRAME_STATS = {
  // Deux minutes à 60 images par seconde : une partie entière tient dans l'anneau.
  capacity: 7200,
  // Fenêtre du « pire moment » : 2 s à 60 images par seconde.
  window: 120,
} as const;

export interface FrameReport {
  // Nombre d'images gardées (au plus `capacity`, les plus récentes).
  frames: number;
  // Intervalle entre images, 95e centile sur tout l'anneau (ms).
  p95Ms: number;
  // Le même centile sur la pire fenêtre de `window` images : le « pire moment » d'AC-8.
  worstWindowP95Ms: number;
  maxMs: number;
  maxDrawCalls: number;
}

// Centile par rang le plus proche d'une liste triée par ordre croissant ; 0 pour une liste vide.
export function percentile(sorted: ArrayLike<number>, p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil(p * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1]!;
}

export class FrameStats {
  private readonly intervals = new Float32Array(FRAME_STATS.capacity);
  private readonly draws = new Uint16Array(FRAME_STATS.capacity);
  // Prochaine case à écrire, et nombre de cases remplies.
  private head = 0;
  private count = 0;

  // Une image rendue : appelée dans la boucle, sans allocation.
  push(intervalMs: number, drawCalls: number): void {
    this.intervals[this.head] = intervalMs;
    this.draws[this.head] = drawCalls;
    this.head = (this.head + 1) % FRAME_STATS.capacity;
    if (this.count < FRAME_STATS.capacity) this.count++;
  }

  reset(): void {
    this.head = 0;
    this.count = 0;
  }

  // Hors de la boucle : ce calcul alloue et trie.
  report(): FrameReport {
    // Images dans l'ordre du temps, de la plus ancienne à la plus récente.
    const ordered = new Float32Array(this.count);
    const start = this.count < FRAME_STATS.capacity ? 0 : this.head;
    let maxMs = 0;
    let maxDrawCalls = 0;
    for (let i = 0; i < this.count; i++) {
      const at = (start + i) % FRAME_STATS.capacity;
      ordered[i] = this.intervals[at]!;
      maxMs = Math.max(maxMs, ordered[i]!);
      maxDrawCalls = Math.max(maxDrawCalls, this.draws[at]!);
    }
    const p95Ms = percentile(ordered.slice().sort(), 0.95);
    // Moins d'images qu'une fenêtre : la pire fenêtre est l'anneau entier.
    let worstWindowP95Ms = this.count < FRAME_STATS.window ? p95Ms : 0;
    for (let i = 0; i + FRAME_STATS.window <= this.count; i++) {
      const p95 = percentile(ordered.slice(i, i + FRAME_STATS.window).sort(), 0.95);
      worstWindowP95Ms = Math.max(worstWindowP95Ms, p95);
    }
    // Au dixième de milliseconde : l'anneau est en simple précision (17,6 s'y lit 17,600000381).
    const round = (ms: number): number => Math.round(ms * 10) / 10;
    return { frames: this.count, p95Ms: round(p95Ms), worstWindowP95Ms: round(worstWindowP95Ms), maxMs: round(maxMs), maxDrawCalls };
  }
}
