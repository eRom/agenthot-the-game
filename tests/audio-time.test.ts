import { describe, expect, test } from "bun:test";
import { droneGain, lowpassCutoff, musicRate, sfxRate } from "../src/audio/time-coupling";
import { TIME, TimeController, type TimeInput } from "../src/sim/time";

const FRAME = 1 / 60;

function input(moveAlpha: number): TimeInput {
  return { moveAlpha, lookPixels: 0, action: false, jumpRising: false };
}

describe("le son suit le temps (AC-19)", () => {
  test("à pleine vitesse le son est ouvert ; au temps minimal il est étouffé", () => {
    expect(lowpassCutoff(1)).toBe(20_000);
    expect(lowpassCutoff(TIME.min)).toBeLessThan(320);
    expect(sfxRate(1)).toBe(1);
    expect(musicRate(1)).toBe(1);
  });

  test("la coupure monte avec le temps, sans jamais redescendre", () => {
    let previous = 0;
    for (let ts = TIME.min; ts <= 1; ts += 0.01) {
      const cutoff = lowpassCutoff(ts);
      expect(cutoff).toBeGreaterThan(previous);
      previous = cutoff;
    }
  });

  test("les débits restent dans leurs bornes : SFX ≥ 0,2, musique ≥ 0,5", () => {
    expect(sfxRate(TIME.min)).toBe(0.2);
    expect(musicRate(TIME.min)).toBe(0.5);
    expect(sfxRate(0.6)).toBe(0.6);
    expect(musicRate(0.6)).toBe(0.6);
  });

  test("le joueur s'arrête : en moins de 0,5 s réelle le son devient grave et étouffé", () => {
    const time = new TimeController();
    for (let t = 0; t < 1; t += FRAME) time.update(FRAME, input(1));
    expect(lowpassCutoff(time.scale)).toBeGreaterThan(15_000);
    for (let t = 0; t < 0.5; t += FRAME) time.update(FRAME, input(0));
    expect(lowpassCutoff(time.scale)).toBeLessThan(400);
    expect(musicRate(time.scale)).toBe(0.5);
  });

  test("le drone monte quand le joueur s'immobilise", () => {
    expect(droneGain(TIME.min)).toBeGreaterThan(droneGain(1) * 3);
  });
});
