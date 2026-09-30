import { describe, expect, test } from "bun:test";
import { type TrackName, barLoop, musicPlayback } from "../src/audio/music";

// Mesures du 2026-09-29 (voir le commentaire de src/audio/music.ts) :
//   ffprobe -v error -show_entries format=duration -of default=nw=1 public/audio/<piste>.mp3
//   ffmpeg -i public/audio/<piste>.mp3 -af silencedetect=noise=-50dB:d=0.5 -f null -
const MEASURED: Record<Exclude<TrackName, "menu">, { duration: number; headSilenceEnd: number; tailSilenceStart: number }> = {
  // game.mp3 : pas de silence de tête ; 2,57 s de silence de 89,14 s à la fin.
  game: { duration: 91.715875, headSilenceEnd: 0, tailSilenceStart: 89.143537 },
  // replay.mp3 : 2,69 s de silence au début, 2,34 s à la fin.
  replay: { duration: 105.404042, headSilenceEnd: 2.691769, tailSilenceStart: 103.059546 },
};

// Marge d'arrondi de la table : au plus 20 ms de musique sacrifiés au bord d'un silence.
const MARGIN = 0.02;

describe("boucles musicales sans silence (plan 2, correctif 2)", () => {
  for (const name of ["game", "replay"] as const) {
    const m = MEASURED[name];

    test(`${name} : offset <= loopStart < loopEnd <= durée`, () => {
      const p = musicPlayback(name, m.duration);
      expect(p.offset).toBeGreaterThanOrEqual(0);
      expect(p.offset).toBeLessThanOrEqual(p.loopStart);
      expect(p.loopStart).toBeLessThan(p.loopEnd);
      expect(p.loopEnd).toBeLessThanOrEqual(m.duration);
    });

    test(`${name} : la lecture démarre là où le son commence, sans couper la musique`, () => {
      const p = musicPlayback(name, m.duration);
      expect(p.offset).toBeLessThanOrEqual(m.headSilenceEnd + 1e-9);
      expect(p.offset).toBeGreaterThanOrEqual(m.headSilenceEnd - MARGIN);
      // La boucle revient au même point : jamais dans le silence de tête.
      expect(p.loopStart).toBeGreaterThanOrEqual(m.headSilenceEnd - MARGIN);
    });

    test(`${name} : la boucle se referme juste avant le silence de fin`, () => {
      const p = musicPlayback(name, m.duration);
      expect(p.loopEnd).toBeLessThanOrEqual(m.tailSilenceStart + 1e-9);
      expect(p.loopEnd).toBeGreaterThanOrEqual(m.tailSilenceStart - MARGIN);
    });
  }

  test("le replay démarre après son silence de tête de 2,7 s", () => {
    expect(musicPlayback("replay", MEASURED.replay.duration).offset).toBeGreaterThan(2.6);
  });

  test("un fichier plus court que prévu (piste régénérée) ne sort jamais de son tampon", () => {
    const p = musicPlayback("replay", 60);
    expect(p.loopEnd).toBeLessThanOrEqual(60);
    expect(p.offset).toBeLessThanOrEqual(p.loopStart);
    expect(p.loopStart).toBeLessThan(p.loopEnd);
  });

  test("un fichier plus court que le silence de tête joue quand même, depuis le début", () => {
    const p = musicPlayback("replay", 2);
    expect(p.offset).toBe(0);
    expect(p.loopStart).toBe(0);
    expect(p.loopEnd).toBe(2);
  });
});

describe("boucle coupée sur le temps (plan 3b, boucle du menu)", () => {
  // Répétition sur game.mp3 (2026-09-30) : analyze-beatgrid.py puis bun scripts/measure-loop.ts. Demandé à 120 BPM,
  // mesuré à 130 : premier temps fort 0,093 s, mesure 1,846184 s, silence de fin à 89,143537 s.
  const GAME = { firstDownbeat: 0.093, barSeconds: 1.846184, tailSilenceStart: 89.143537 };

  test("la boucle dure un nombre entier de mesures", () => {
    const p = barLoop(GAME);
    const bars = (p.loopEnd - p.loopStart) / GAME.barSeconds;
    expect(Math.abs(bars - Math.round(bars))).toBeLessThan(1e-9);
    expect(Math.round(bars)).toBe(48);
  });

  test("elle part juste avant le premier temps fort et s'arrête avant le silence de fin", () => {
    const p = barLoop(GAME);
    expect(p.offset).toBe(p.loopStart);
    expect(p.loopStart).toBeLessThan(GAME.firstDownbeat);
    expect(p.loopStart).toBeGreaterThan(GAME.firstDownbeat - 0.05);
    expect(p.loopEnd).toBeLessThanOrEqual(GAME.tailSilenceStart);
    // Au plus une mesure de musique laissée de côté à la fin.
    expect(p.loopEnd).toBeGreaterThan(GAME.tailSilenceStart - GAME.barSeconds);
  });

  test("un temps fort à l'instant 0 ne fait pas partir la boucle avant le fichier", () => {
    expect(barLoop({ firstDownbeat: 0.01, barSeconds: 2, tailSilenceStart: 10 }).loopStart).toBe(0);
  });
});
