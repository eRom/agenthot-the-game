import { describe, expect, test } from "bun:test";
import { BULLET_LOOK, headScale, trailLength } from "../src/render/bullet-look";
import { Game } from "../src/sim/game";
import { vec3 } from "../src/sim/vec3";
import { createWorldView, writeGameView } from "../src/sim/view";
import { FRAME, enemyAt, input, testRoom } from "./helpers";

const SPEED = vec3(0, 0, -45);

describe("aspect des balles (tâche 1 du plan 2)", () => {
  test("une balle du joueur qui vient de partir de l'œil ne couvre pas l'écran", () => {
    const cam = vec3(0, 1.7, 0);
    const pos = vec3(0, 1.7, -0.02);
    expect(headScale(pos, cam)).toBe(0);
    expect(trailLength(pos, SPEED, cam, cam)).toBe(0);
  });

  test("la traînée d'une balle du joueur reste hors de la sphère de dégagement de la caméra", () => {
    const cam = vec3(0, 1.7, 0);
    const pos = vec3(0, 1.7, -3);
    expect(trailLength(pos, SPEED, cam, cam)).toBeCloseTo(3 - BULLET_LOOK.cameraClearance, 5);
    expect(headScale(pos, cam)).toBe(1);
  });

  test("la traînée ne remonte jamais au-delà du point de départ (pas à travers le tireur)", () => {
    const origin = vec3(0, 1.4, -10);
    const pos = vec3(0, 1.4, -9.5);
    const cam = vec3(0, 1.7, 0);
    expect(trailLength(pos, vec3(0, 0, 45), origin, cam)).toBeCloseTo(0.5, 5);
  });

  test("une balle ennemie qui arrive sur la caméra garde sa traînée pleine", () => {
    const origin = vec3(0, 1.7, -8);
    const pos = vec3(0, 1.7, -1);
    const cam = vec3(0, 1.7, 0);
    expect(trailLength(pos, vec3(0, 0, 45), origin, cam)).toBe(BULLET_LOOK.trailMax);
  });

  test("la vue du monde porte le point de départ de chaque balle", () => {
    // Ennemi à l'écart de la trajectoire : la balle vole jusqu'au mur du fond.
    const game = new Game(testRoom([enemyAt(10, -12, false)]));
    const view = createWorldView(game.room.boxes.length, game.shatter.shards);
    game.step(FRAME, input({ fire: true }));
    for (let i = 0; i < 20; i++) game.step(FRAME, input({ moveZ: 1 }));
    writeGameView(game, view);
    const bullet = view.bullets.find((b) => b.active)!;
    expect(bullet.origin.y).toBeCloseTo(1.7, 5);
    expect(bullet.origin.z).toBeCloseTo(0, 5);
    expect(bullet.pos.z).toBeLessThan(-1);
  });
});
