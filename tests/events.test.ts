import { describe, expect, test } from "bun:test";
import { ReplayPlayer } from "../src/replay/player";
import { ReplayRecorder } from "../src/replay/recorder";
import { EventQueue, type GameEventType } from "../src/sim/events";
import { Game } from "../src/sim/game";
import { vec3 } from "../src/sim/vec3";
import { createWorldView, writeGameView } from "../src/sim/view";
import { FRAME, enemyAt, input, run, testRoom } from "./helpers";

// Une balle ennemie tirée vers le joueur immobile, décalée de `offsetX` sur le côté de sa tête.
function enemyBulletPast(offsetX: number) {
  const game = new Game(testRoom([enemyAt(10, -12, false)]));
  game.spawnBullet(vec3(offsetX, 1.7, -6), vec3(0, 0, 1), game.enemies[0]!.id);
  const log = run(game, () => input(), (g) => !g.bullets.some((b) => b.active), 20);
  return { game, nearMisses: log.filter((e) => e.type === "nearMiss").length };
}

describe("frôlement (spec 7.3)", () => {
  test("une balle ennemie qui passe à 0,4 m de la tête sans toucher émet un seul frôlement", () => {
    const { game, nearMisses } = enemyBulletPast(0.4);
    expect(game.player.alive).toBe(true);
    expect(nearMisses).toBe(1);
  });

  test("une balle qui passe à 1 m de la tête n'émet rien", () => {
    expect(enemyBulletPast(1).nearMisses).toBe(0);
  });

  test("une balle qui touche le joueur n'est pas un frôlement", () => {
    const { game, nearMisses } = enemyBulletPast(0);
    expect(game.player.alive).toBe(false);
    expect(nearMisses).toBe(0);
  });

  test("les balles du joueur ne frôlent jamais le joueur", () => {
    const game = new Game(testRoom([enemyAt(10, -12, false)]));
    const log = run(game, (f) => input({ fire: f === 0 }), () => false, 2);
    expect(log.some((e) => e.type === "shot")).toBe(true);
    expect(log.some((e) => e.type === "nearMiss")).toBe(false);
  });
});

describe("événements rejoués pour le son du replay", () => {
  test("le replay réémet le tir puis l'éclatement, dans l'ordre", () => {
    const game = new Game(testRoom([enemyAt(0, -12, false)]));
    const view = createWorldView(game.room.boxes.length, game.shatter.shards);
    const recorder = new ReplayRecorder();
    writeGameView(game, view);
    recorder.capture(game.simTime, view, true);
    for (let frame = 0; frame < 60 * 60 && game.status === "playing"; frame++) {
      game.step(FRAME, input({ fire: frame === 30, moveX: frame > 30 ? 0.5 : 0 }));
      writeGameView(game, view);
      recorder.recordEvents(game.events);
      recorder.capture(game.simTime, view, game.status !== "playing");
    }
    expect(game.status).toBe("won");
    const replay = new ReplayPlayer(recorder, game.room);
    const seen: GameEventType[] = [];
    while (!replay.finished) {
      replay.update(FRAME);
      for (let i = 0; i < replay.events.count; i++) seen.push(replay.events.items[i]!.type);
    }
    expect(seen.indexOf("shot")).toBeGreaterThanOrEqual(0);
    expect(seen.indexOf("enemyKilled")).toBeGreaterThan(seen.indexOf("shot"));
    // Un redémarrage du replay vide la file : rien n'est rejoué deux fois.
    replay.restart();
    expect(replay.events.count).toBe(0);
  });

  test("90 s de combat dense (350 tirs ennemis et leurs impacts) tiennent dans le tampon d'événements", () => {
    const recorder = new ReplayRecorder();
    const queue = new EventQueue(2);
    for (let i = 0; i < 350; i++) {
      queue.clear();
      queue.push("shot", i * 0.25, 1, -1, vec3(), vec3());
      queue.push("bulletImpact", i * 0.25 + 0.1, 1, 0, vec3(), vec3());
      recorder.recordEvents(queue);
    }
    expect(recorder.eventCount).toBe(700);
    // Le tout premier tir est toujours là.
    expect(recorder.events[0]).toBe(0);
  });
});
