import { describe, expect, test } from "bun:test";
import { NO_ID, PLAYER_ID } from "../src/sim/entities";
import { Game } from "../src/sim/game";
import { aabb } from "../src/sim/geometry";
import { SHATTER, ShatterSystem } from "../src/sim/shatter";
import { set, vec3 } from "../src/sim/vec3";
import { FRAME, enemyAt, input, run, testRoom } from "./helpers";

describe("éclats et décor (plan 2)", () => {
  test("les éclats d'un corps sur une passerelle se posent sur la passerelle, pas au travers", () => {
    const shatter = new ShatterSystem();
    const deck = aabb(-6, 3.4, -6, 6, 3.5, 6);
    shatter.spawnBody(vec3(0, 3.5, 0), 1.8, 0.3, vec3(), 42, 0);
    for (let i = 0; i < 60 * 6; i++) shatter.step(FRAME, [deck], [true]);
    const onDeck = shatter.shards.filter((s) => s.active && Math.abs(s.pos.x) < 6 && Math.abs(s.pos.z) < 6);
    expect(onDeck.length).toBeGreaterThan(SHATTER.shardsPerBody / 2);
    for (const s of onDeck) expect(s.pos.y).toBeGreaterThanOrEqual(3.5);
  });

  test("une passerelle désactivée (baie explosée) ne retient plus les éclats", () => {
    const shatter = new ShatterSystem();
    const deck = aabb(-6, 3.4, -6, 6, 3.5, 6);
    shatter.spawnBody(vec3(0, 3.5, 0), 1.8, 0.3, vec3(), 42, 0);
    for (let i = 0; i < 60 * 6; i++) shatter.step(FRAME, [deck], [false]);
    for (const s of shatter.shards) if (s.active) expect(s.pos.y).toBeLessThan(1);
  });
});

describe("arme d'un ennemi tué (plan 2)", () => {
  test("elle part dans le sens de la balle, pas à la verticale", () => {
    const game = new Game(testRoom([enemyAt(0, -6)]));
    const weapon = game.weapons[game.enemies[0]!.weaponId]!;
    game.killEnemy(game.enemies[0]!, vec3(0, 0, -45));
    expect(weapon.state).toBe("flying");
    expect(weapon.vel.z).toBeLessThan(-1);
  });
});

describe("mêlée ennemie : chaque garde compte (plan 2)", () => {
  test("un ennemi surélevé, ligne de vue dégagée, ne prend jamais d'élan et ne frappe pas", () => {
    // Socle de 1,2 m devant le joueur : l'ennemi est à portée horizontale, mais trop haut.
    const room = testRoom([{ ...enemyAt(0, -1, false, false), pos: vec3(0, 1.2, -1) }], false);
    room.boxes.push(aabb(-0.5, 0, -1.5, 0.5, 1.2, -0.5));
    const game = new Game(room);
    let windup = false;
    run(game, () => input(), (g) => {
      windup ||= g.enemies[0]!.state === "windup";
      return false;
    }, 60);
    expect(windup).toBe(false);
    expect(game.status).toBe("playing");
  });

  test("un joueur qui passe derrière une baie pendant l'élan n'est pas touché", () => {
    const room = testRoom([enemyAt(0, -1.1, false, false)], false);
    // Petite baie entre l'ennemi et la position de repli du joueur.
    room.boxes.push(aabb(0.35, 0, -0.75, 0.55, 2.2, -0.55));
    const game = new Game(room);
    run(game, () => input(), (g) => g.enemies[0]!.state === "windup", 30);
    expect(game.enemies[0]!.state).toBe("windup");
    // Repli : toujours à portée (1,27 m), mais la baie coupe la ligne de vue.
    set(game.player.pos, 0.9, 0, -0.2);
    run(game, () => input(), () => false, 60);
    expect(game.status).toBe("playing");
  });
});

describe("lancer et ramasser dans la même image (plan 2)", () => {
  test("E au moment du lancer ne reprend pas l'arme qui vient de partir", () => {
    const game = new Game(testRoom([enemyAt(10, -12, false)]));
    const weaponId = game.player.weaponId;
    game.step(FRAME, input({ throw: true, use: true }));
    expect(game.player.weaponId).toBe(NO_ID);
    expect(game.weapons[weaponId]!.state).toBe("flying");
    expect(game.weapons[weaponId]!.thrownBy).toBe(PLAYER_ID);
  });
});
