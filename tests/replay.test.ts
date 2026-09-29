import { describe, expect, test } from "bun:test";
import { ReplayPlayer } from "../src/replay/player";
import { EVENT_STRIDE, REPLAY, ReplayRecorder } from "../src/replay/recorder";
import { EventQueue } from "../src/sim/events";
import { Game } from "../src/sim/game";
import { vec3 } from "../src/sim/vec3";
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

  test("un éclatement d'avant la fenêtre gardée ne rejaillit pas au début du replay", () => {
    const game = new Game(testRoom([enemyAt(0, -12, false)]));
    const view = createWorldView(game.room.boxes.length, game.shatter.shards);
    writeGameView(game, view);
    const recorder = new ReplayRecorder();
    const queue = new EventQueue(4);
    queue.push("enemyKilled", 1.0, -1, 1, vec3(0, 0, -5), vec3(0, 0, -1));
    queue.push("rackBurst", 2.0, -1, 0, vec3(), vec3());
    recorder.recordEvents(queue);
    // 120 s de simulation : les deux événements sont antérieurs à la fenêtre gardée.
    for (let i = 0; i <= 120 * 60; i++) recorder.capture(i / 60, view, true);
    const replay = new ReplayPlayer(recorder, game.room);
    expect(replay.shatter.shards.some((s) => s.active)).toBe(false);
    expect(replay.view.boxEnabled[0]).toBe(false);
  });

  test("au-delà de la capacité d'événements, le replay garde les plus récents", () => {
    const recorder = new ReplayRecorder();
    const queue = new EventQueue(4);
    const total = REPLAY.eventCapacity + 6;
    for (let t = 0; t < total; t++) {
      queue.clear();
      queue.push("enemyKilled", t, -1, 1, vec3(), vec3());
      recorder.recordEvents(queue);
    }
    expect(recorder.eventCount).toBe(REPLAY.eventCapacity);
    expect(recorder.events[0]).toBe(6);
    expect(recorder.events[(REPLAY.eventCapacity - 1) * EVENT_STRIDE]).toBe(total - 1);
  });

  test("l'enregistrement tient 60 échantillons par seconde de simulation", () => {
    const game = new Game(testRoom([enemyAt(10, -12, false)]));
    const view = createWorldView(game.room.boxes.length, game.shatter.shards);
    const recorder = new ReplayRecorder();
    writeGameView(game, view);
    recorder.capture(game.simTime, view, true);
    for (let frame = 0; frame < 180; frame++) {
      game.step(0.0166, input({ moveZ: 1 }));
      writeGameView(game, view);
      recorder.capture(game.simTime, view);
    }
    expect(recorder.count).toBeGreaterThanOrEqual(0.9 * 60 * game.simTime);
  });
});
