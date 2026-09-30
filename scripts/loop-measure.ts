// Mesure d'une boucle musicale (spec 7.2) : silences de tête et de fin (ffmpeg silencedetect) et grille des temps
// (analyze-beatgrid.py du plugin Hyperframes). Outils purs de scripts/measure-loop.ts.
import type { BarMeasure } from "../src/audio/music";

export interface Silences {
  // Fin du silence de tête (s), 0 s'il n'y en a pas ; début du silence de fin (s), la durée s'il n'y en a pas.
  headSilenceEnd: number;
  tailSilenceStart: number;
}

// Lit la sortie de `ffmpeg -af silencedetect` : lignes « silence_start: t » et « silence_end: t | ... ».
export function parseSilences(ffmpegLog: string, duration: number): Silences {
  const spans: { start: number; end: number }[] = [];
  for (const match of ffmpegLog.matchAll(/silence_(start|end): (-?[\d.]+)/g)) {
    const t = Number(match[2]);
    if (match[1] === "start") spans.push({ start: t, end: duration });
    else if (spans.length > 0) spans[spans.length - 1]!.end = t;
  }
  const head = spans.find((s) => s.start <= 0.01);
  const tail = spans.findLast((s) => s.end >= duration - 0.05 && s !== head);
  return { headSilenceEnd: head ? head.end : 0, tailSilenceStart: tail ? tail.start : duration };
}

// Durée d'un temps (s) : pente des moindres carrés sur tous les temps pointés. Chaque pointage est à ±23 ms près
// (analyse à 22 050 Hz, pas de 512), la pente sur tout le morceau est précise à la milliseconde.
export function beatPeriod(beats: readonly number[]): number {
  const n = beats.length;
  const meanIndex = (n - 1) / 2;
  const meanTime = beats.reduce((sum, t) => sum + t, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanIndex) * (beats[i]! - meanTime);
    den += (i - meanIndex) ** 2;
  }
  return num / den;
}

export interface Audiomap {
  tempo: { beats_per_bar: number };
  grid: { beats_sec: number[]; downbeats_sec: number[] };
}

// Mesure de la boucle : premier temps fort après le silence de tête (50 ms de tolérance), mesure = temps × temps par
// mesure, et début du silence de fin.
export function barMeasure(map: Audiomap, silences: Silences): BarMeasure {
  const firstDownbeat = map.grid.downbeats_sec.find((t) => t >= silences.headSilenceEnd - 0.05);
  if (firstDownbeat === undefined) throw new Error("no downbeat after the head silence");
  return {
    firstDownbeat,
    barSeconds: beatPeriod(map.grid.beats_sec) * map.tempo.beats_per_bar,
    tailSilenceStart: silences.tailSilenceStart,
  };
}
