import { describe, expect, test } from "bun:test";
import { ReplayPlayer } from "../src/replay/player";
import { REPLAY, ReplayRecorder } from "../src/replay/recorder";
import { Game } from "../src/sim/game";
import { createWorldView, writeGameView } from "../src/sim/view";
import { FRAME, enemyAt, input, testRoom } from "./helpers";

function playAndRecord(game: Game, script: (frame: number) => ReturnType<typeof input>, maxFrames: number) {
  const recorder = new ReplayRecorder();
  const view = createWorldView(game.room.boxes.length, game.shatter.shards);
  writeGameView(game, view);
  recorder.capture(game.simTime, view, true);
  for (let frame = 0; frame < maxFrames && game.status === "playing"; frame++) {
    game.step(FRAME, script(frame));
    writeGameView(game, view);
    recorder.recordEvents(game.events);
    recorder.capture(game.simTime, view, game.status !== "playing");
  }
  return recorder;
}

describe("replay (AC-7)", () => {
  test("la durée du replay égale le temps de simulation écoulé, à 5 % près", () => {
    const game = new Game(testRoom([enemyAt(0, -12, false)]));
    // Le joueur marche 2 s, reste immobile, puis tire.
    const recorder = playAndRecord(game, (f) => (f < 120 ? input({ moveZ: 1 }) : input({ fire: f === 400 })), 60 * 120);
    expect(game.status).toBe("won");
    const replay = new ReplayPlayer(recorder, game.room);
    expect(Math.abs(replay.duration - game.simTime) / game.simTime).toBeLessThanOrEqual(0.05);
    // Relu à 60 i/s réelles, le replay dure bien sa durée, pas le temps réel de la partie.
    let frames = 0;
    while (!replay.finished && frames < 60 * 60) {
      replay.update(FRAME);
      frames++;
    }
    expect(Math.abs(frames * FRAME - replay.duration)).toBeLessThanOrEqual(FRAME * 2);
    expect(game.realTime).toBeGreaterThan(replay.duration * 2);
    // L'éclatement de l'ennemi est rejoué.
    expect(replay.shatter.shards.some((s) => s.active)).toBe(true);
  });

  test("la caméra du replay suit le trajet du joueur", () => {
    const game = new Game(testRoom([enemyAt(0, -12, false)]));
    const recorder = playAndRecord(game, (f) => (f < 120 ? input({ moveZ: 1 }) : input({ fire: f === 200 })), 60 * 60);
    const replay = new ReplayPlayer(recorder, game.room);
    const startZ = replay.view.camera.pos.z;
    while (!replay.finished) replay.update(FRAME);
    expect(startZ).toBeCloseTo(0, 1);
    expect(replay.view.camera.pos.z).toBeLessThan(-5);
  });

  test("au-delà de 90 s de simulation, le replay garde les 90 dernières secondes", () => {
    const game = new Game(testRoom([enemyAt(0, -12, false)]));
    const view = createWorldView(game.room.boxes.length, game.shatter.shards);
    writeGameView(game, view);
    const recorder = new ReplayRecorder();
    // 120 s de simulation à 60 Hz, soit plus que la capacité du tampon.
    for (let i = 0; i <= 120 * 60; i++) recorder.capture(i / 60, view, true);
    expect(recorder.count).toBe(REPLAY.capacity);
    const replay = new ReplayPlayer(recorder, game.room);
    expect(replay.duration).toBeCloseTo((REPLAY.capacity - 1) / 60, 1);
    let frames = 0;
    while (!replay.finished && frames < 60 * 100) {
      replay.update(FRAME);
      frames++;
    }
    expect(replay.finished).toBe(true);
  });
});
