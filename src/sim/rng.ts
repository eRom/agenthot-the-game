// Générateur pseudo-aléatoire à graine (mulberry32) : mêmes tirages en jeu et en replay.
export class Rng {
  private state = 0;

  constructor(seed = 1) {
    this.reset(seed);
  }

  reset(seed: number): void {
    this.state = seed >>> 0;
  }

  // Nombre dans [0, 1).
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
}
