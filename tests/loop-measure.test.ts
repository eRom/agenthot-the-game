import { describe, expect, test } from "bun:test";
import { barMeasure, beatPeriod, parseSilences } from "../scripts/loop-measure";

// Sortie réelle de `ffmpeg -af silencedetect=noise=-50dB:d=0.5` sur public/audio/replay.mp3 (2026-09-30).
const REPLAY_LOG = `[Parsed_silencedetect_0 @ 0x79230a8900] silence_start: 0
[Parsed_silencedetect_0 @ 0x79230a8900] silence_end: 2.691769 | silence_duration: 2.691769
[Parsed_silencedetect_0 @ 0x79230a8900] silence_start: 103.059546
[Parsed_silencedetect_0 @ 0x79230a8900] silence_end: 105.404082 | silence_duration: 2.344535`;

describe("mesure d'une boucle : silences (plan 3b)", () => {
  test("silence de tête et de fin, comme mesurés à la main au plan 2", () => {
    expect(parseSilences(REPLAY_LOG, 105.404042)).toEqual({ headSilenceEnd: 2.691769, tailSilenceStart: 103.059546 });
  });

  test("sans silence de tête ; silence de fin sans ligne de fin (il court jusqu'au bout)", () => {
    expect(parseSilences("[x] silence_start: 89.143537", 91.715875)).toEqual({ headSilenceEnd: 0, tailSilenceStart: 89.143537 });
  });

  test("un silence au milieu du morceau n'est ni la tête ni la fin", () => {
    const log = "silence_start: 40\nsilence_end: 41 | silence_duration: 1";
    expect(parseSilences(log, 60)).toEqual({ headSilenceEnd: 0, tailSilenceStart: 60 });
  });
});

describe("mesure d'une boucle : tempo (plan 3b)", () => {
  test("la durée d'un temps se lit sur tous les temps, malgré le pointage à ±23 ms", () => {
    // 200 temps à 130 BPM, pointés avec une erreur alternée de ±20 ms.
    const period = 60 / 130;
    const beats = Array.from({ length: 200 }, (_, i) => 0.093 + i * period + (i % 2 === 0 ? 0.02 : -0.02));
    expect(Math.abs(beatPeriod(beats) - period)).toBeLessThan(0.0005);
  });

  test("premier temps fort après le silence de tête, mesure = temps × temps par mesure", () => {
    const period = 0.5;
    const map = {
      tempo: { beats_per_bar: 4 },
      grid: { beats_sec: Array.from({ length: 64 }, (_, i) => 0.4 + i * period), downbeats_sec: [0.4, 2.4, 4.4, 6.4] },
    };
    const m = barMeasure(map, { headSilenceEnd: 2.42, tailSilenceStart: 31 });
    expect(m.firstDownbeat).toBe(2.4);
    expect(m.barSeconds).toBeCloseTo(2, 9);
    expect(m.tailSilenceStart).toBe(31);
  });
});
