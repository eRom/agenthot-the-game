import { describe, expect, test } from "bun:test";
import { TIME, TimeController, type TimeInput } from "../src/sim/time";

const still: TimeInput = { moveAlpha: 0, lookPixels: 0, action: false, jumpRising: false };
const walking: TimeInput = { ...still, moveAlpha: 1 };

function runFor(tc: TimeController, seconds: number, input: TimeInput, dt = 1 / 60): number {
  let simDt = 0;
  for (let t = 0; t < seconds - 1e-9; t += dt) simDt = tc.update(dt, input);
  return simDt;
}

describe("TimeController (AC-2)", () => {
  test("à l'arrêt, le temps reste à 3 %", () => {
    const tc = new TimeController();
    runFor(tc, 2, still);
    expect(tc.scale).toBeCloseTo(TIME.min, 5);
  });

  test("en marchant, le temps dépasse 95 % en 0,3 s réelle", () => {
    const tc = new TimeController();
    runFor(tc, 0.3, walking);
    expect(tc.scale).toBeGreaterThanOrEqual(0.95);
  });

  test("à l'arrêt après la marche, le temps redescend sous 5 % en 0,5 s", () => {
    const tc = new TimeController();
    runFor(tc, 1, walking);
    runFor(tc, 0.5, still);
    expect(tc.scale).toBeLessThanOrEqual(0.05);
  });

  test("tourner la tête seule accélère peu le temps", () => {
    const tc = new TimeController();
    // 2 000 px/s de souris, bien au-delà du seuil.
    runFor(tc, 1, { ...still, lookPixels: 2000 / 60 });
    expect(tc.scale).toBeLessThanOrEqual(TIME.min + TIME.lookWeight + 1e-6);
    expect(tc.scale).toBeGreaterThan(TIME.min + 0.1);
  });

  test("une action donne un coup d'accélération bref", () => {
    const tc = new TimeController();
    tc.update(1 / 60, { ...still, action: true });
    runFor(tc, 0.1, still);
    const during = tc.scale;
    runFor(tc, 1, still);
    expect(during).toBeGreaterThan(0.3);
    expect(tc.scale).toBeLessThan(0.05);
  });

  test("le pas de simulation ne dépasse jamais 1/60 s", () => {
    const tc = new TimeController();
    runFor(tc, 1, walking, 1 / 20);
    expect(tc.update(1 / 20, walking)).toBeLessThanOrEqual(TIME.maxSimDt);
  });
});
