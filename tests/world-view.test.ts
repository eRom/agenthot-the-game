import { describe, expect, test } from "bun:test";
import { ENEMY, PLAYER, PLAYER_ID } from "../src/sim/entities";
import { Game } from "../src/sim/game";
import { createWorldView, writeGameView } from "../src/sim/view";
import { FRAME, enemyAt, input, run, testRoom } from "./helpers";

function viewOf(game: Game) {
  const view = createWorldView(game.room.boxes.length, game.shatter.shards);
  writeGameView(game, view);
  return view;
}

describe("vue du monde complète (plan 2, avant l'animation)", () => {
  test("un ennemi qui marche accumule la distance parcourue", () => {
    const game = new Game(testRoom([enemyAt(0, -14, false, true)]));
    const start = game.enemies[0]!.pos.z;
    run(game, () => input({ moveX: 1 }), () => false, 1);
    const view = viewOf(game);
    const walked = Math.abs(game.enemies[0]!.pos.z - start);
    expect(walked).toBeGreaterThan(0.5);
    expect(view.enemies[0]!.walkDistance).toBeGreaterThanOrEqual(walked - 1e-6);
  });

  test("la vue dit si l'ennemi est armé et où il en est de sa visée", () => {
    const game = new Game(testRoom([enemyAt(0, -5, true), enemyAt(6, -5, false)]));
    run(game, () => input({ moveX: 0.3 }), (g) => g.enemies[0]!.state === "aim" && g.enemies[0]!.stateTime > 0.1, 5);
    const view = viewOf(game);
    const shooter = view.enemies[0]!;
    expect(shooter.armed).toBe(true);
    expect(shooter.state).toBe("aim");
    expect(shooter.stateProgress).toBeCloseTo(game.enemies[0]!.stateTime / ENEMY.aimTime, 5);
    expect(view.enemies[1]!.armed).toBe(false);
  });

  test("la progression d'un vacillement va de 0 à 1 sur 1,5 s de simulation", () => {
    const game = new Game(testRoom([enemyAt(0, -3, true)]));
    game.staggerEnemy(game.enemies[0]!, game.player.pos);
    run(game, () => input({ moveX: 1 }), (g) => g.simTime >= ENEMY.staggerTime / 2, 5);
    const progress = viewOf(game).enemies[0]!.stateProgress;
    expect(progress).toBeGreaterThan(0.45);
    expect(progress).toBeLessThan(0.6);
  });

  test("une arme tenue porte l'identifiant de son porteur", () => {
    const game = new Game(testRoom([enemyAt(0, -5, true)]));
    const view = viewOf(game);
    const enemyWeapon = game.enemies[0]!.weaponId;
    expect(view.weapons[enemyWeapon]!.holderId).toBe(game.enemies[0]!.id);
    expect(view.weapons[game.player.weaponId]!.holderId).toBe(PLAYER_ID);
  });

  test("la caméra descend en douceur à l'accroupissement, et remonte de même", () => {
    // Un ennemi immobile et désarmé, au loin : la partie reste en cours.
    const game = new Game(testRoom([enemyAt(10, -12, false)]));
    game.step(FRAME, input({ crouch: true }));
    expect(viewOf(game).camera.pos.y).toBeGreaterThan(1.4);
    run(game, () => input({ crouch: true }), () => false, 0.3);
    expect(viewOf(game).camera.pos.y).toBeLessThan(PLAYER.eyeCrouch + 0.05);
    game.step(FRAME, input());
    expect(viewOf(game).camera.pos.y).toBeLessThan(1.1);
    run(game, () => input(), () => false, 0.3);
    expect(viewOf(game).camera.pos.y).toBeGreaterThan(PLAYER.eyeStand - 0.05);
  });
});
