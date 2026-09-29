import { describe, expect, test } from "bun:test";
import { SEGMENT, createEnemyPose, poseEnemy } from "../src/render/enemy-pose";
import { Game } from "../src/sim/game";
import { createWorldView, writeGameView } from "../src/sim/view";
import { FRAME, enemyAt, input, testRoom } from "./helpers";

// Saut de jambe maximal admis entre deux images. En marche, la jambe bouge de 0,107 rad par image au plus.
const MAX_LEG_STEP = 0.15;

describe("amplitude de foulée : pas de saut de jambe au tir (plan 2, correctif 1)", () => {
  // Un ennemi armé qui marche vers le joueur immobile, entre à portée, vise, tire. La phase du pas à
  // l'instant du tir dépend de la distance de départ : on balaie plusieurs distances pour couvrir les phases.
  // (Un ennemi posé d'emblée à portée ne marcherait jamais : sa foulée resterait à 0 et le test ne prouverait rien.)
  test("aucune jambe ne saute de plus de 0,15 rad entre deux images, de la marche jusqu'au tir", () => {
    let worstStep = 0;
    let shotsSeen = 0;
    for (let start = 9; start <= 12.5; start += 0.25) {
      const game = new Game(testRoom([enemyAt(0, -start, true, true)]));
      const view = createWorldView(game.room.boxes.length, game.shatter.shards);
      const pose = createEnemyPose();
      let prevLegL = 0;
      let prevLegR = 0;
      let first = true;
      let framesAfterShot = -1;
      for (let frame = 0; frame < 6000 && game.status === "playing"; frame++) {
        game.step(FRAME, input());
        writeGameView(game, view);
        poseEnemy(view.enemies[0]!, pose);
        const legL = pose.segments[SEGMENT.legL]!.pitch;
        const legR = pose.segments[SEGMENT.legR]!.pitch;
        if (!first) worstStep = Math.max(worstStep, Math.abs(legL - prevLegL), Math.abs(legR - prevLegR));
        first = false;
        prevLegL = legL;
        prevLegR = legR;
        // On continue une dizaine d'images après le tir : le saut se produit au passage aim -> cooldown.
        if (framesAfterShot < 0 && game.enemies[0]!.state === "cooldown") {
          framesAfterShot = 0;
          shotsSeen++;
        }
        if (framesAfterShot >= 0 && ++framesAfterShot > 8) break;
      }
    }
    // Garde-fou : le balayage a bien vu chaque tir (sinon le test ne prouverait rien).
    expect(shotsSeen).toBe(15);
    expect(worstStep).toBeLessThan(MAX_LEG_STEP);
  });
});

describe("amplitude de foulée : la simulation la porte (plan 2, correctif 1)", () => {
  test("elle vaut 0 à l'apparition", () => {
    const game = new Game(testRoom([enemyAt(0, -12, false, true)]));
    expect(game.enemies[0]!.strideAmp).toBe(0);
  });

  test("un ennemi qui marche dépasse 0,9 ; s'il s'arrête, elle retombe sous 0,05 en 0,5 s de simulation", () => {
    // Désarmé et mobile, à 12 m : il marche vers le joueur sans jamais tirer.
    const game = new Game(testRoom([enemyAt(0, -12, false, true)], false));
    const enemy = game.enemies[0]!;
    // Le joueur se déplace de côté pour que le temps s'écoule (à l'arrêt, il est au ralenti).
    while (game.simTime < 1) game.step(FRAME, input({ moveX: 1 }));
    expect(enemy.state).toBe("approach");
    expect(enemy.strideAmp).toBeGreaterThan(0.9);

    enemy.mobile = false;
    const stopTime = game.simTime;
    while (game.simTime - stopTime < 0.5) game.step(FRAME, input({ moveX: 1 }));
    expect(enemy.strideAmp).toBeLessThan(0.05);
  });

  test("la vue du jeu expose l'amplitude de foulée", () => {
    const game = new Game(testRoom([enemyAt(0, -12, false, true)], false));
    const view = createWorldView(game.room.boxes.length, game.shatter.shards);
    while (game.simTime < 1) game.step(FRAME, input({ moveX: 1 }));
    writeGameView(game, view);
    expect(view.enemies[0]!.strideAmp).toBe(game.enemies[0]!.strideAmp);
    expect(view.enemies[0]!.strideAmp).toBeGreaterThan(0.9);
  });
});
