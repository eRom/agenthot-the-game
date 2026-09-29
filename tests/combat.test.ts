import { describe, expect, test } from "bun:test";
import { ENEMY, NO_ID, PLAYER, PLAYER_ID, WEAPON } from "../src/sim/entities";
import { Game } from "../src/sim/game";
import { enemyAt, input, run, testRoom } from "./helpers";

describe("le temps vu par une balle ennemie (AC-1)", () => {
  test("joueur immobile : une balle tirée à 7,9 m (portée max) met au moins 5 s réelles à arriver", () => {
    const game = new Game(testRoom([enemyAt(0, -7.9)]));
    const log = run(game, () => input(), (g) => g.status === "dead", 120);
    const shot = log.find((e) => e.type === "shot" && e.ownerId !== PLAYER_ID);
    const death = log.find((e) => e.type === "playerKilled");
    expect(shot).toBeDefined();
    expect(death).toBeDefined();
    expect(death!.realTime - shot!.realTime).toBeGreaterThanOrEqual(5);
  });
});

describe("désarmement et capture (AC-4)", () => {
  test("lancer l'arme fait vaciller l'ennemi, son arme se rattrape en vol, pleine, et tire", () => {
    const game = new Game(testRoom([enemyAt(0, -5)]));
    // Cas réel : le joueur lance son pistolet vide.
    game.weapons[game.player.weaponId]!.ammo = 0;
    let phase: "throw" | "wait" | "walk" | "fire" | "done" = "throw";
    let caughtAmmo = -1;
    const enemyWeaponId = game.enemies[0]!.weaponId;
    let stateBeforeCatch = "";
    const log = run(
      game,
      (_, g) => {
        if (phase === "throw") {
          phase = "wait";
          return input({ throw: true });
        }
        if (phase === "wait") {
          if (g.enemies[0]!.state === "stagger") phase = "walk";
          return input();
        }
        if (phase === "walk") {
          if (g.player.weaponId !== NO_ID) {
            caughtAmmo = g.weapons[g.player.weaponId]!.ammo;
            phase = "fire";
            return input();
          }
          stateBeforeCatch = g.weapons[enemyWeaponId]!.state;
          return input({ moveZ: 1 });
        }
        if (phase === "fire") {
          phase = "done";
          return input({ fire: true });
        }
        return input();
      },
      (_, l) => phase === "done" && l.some((e) => e.type === "shot" && e.ownerId === PLAYER_ID),
      30,
    );
    expect(log.some((e) => e.type === "enemyStaggered")).toBe(true);
    const caught = log.find((e) => e.type === "weaponPicked");
    expect(caught).toBeDefined();
    // Captée en vol : c'est l'arme de l'ennemi, et elle volait encore juste avant la prise.
    expect(game.player.weaponId).toBe(enemyWeaponId);
    expect(stateBeforeCatch).toBe("flying");
    expect(caughtAmmo).toBe(WEAPON.capacity);
    expect(log.some((e) => e.type === "shot" && e.ownerId === PLAYER_ID)).toBe(true);
  });

  test("une arme vidée puis lancée et reprise reste vide", () => {
    // Un ennemi désarmé et immobile, loin : sans lui la partie serait gagnée dès la 1re image.
    const game = new Game(testRoom([enemyAt(10, -14, false)]));
    const weaponId = game.player.weaponId;
    game.weapons[weaponId]!.ammo = 0;
    // Lancer vers le bas : l'arme retombe au sol bien avant le mur du fond.
    game.player.pitch = -0.6;
    game.step(1 / 60, input({ throw: true }));
    for (let i = 0; i < 6000 && game.weapons[weaponId]!.state !== "ground"; i++) game.step(1 / 60, input());
    expect(game.weapons[weaponId]!.state).toBe("ground");
    // On se place à côté de l'arme posée, puis on la ramasse.
    game.player.pos.x = game.weapons[weaponId]!.pos.x;
    game.player.pos.z = game.weapons[weaponId]!.pos.z + 0.5;
    game.step(1 / 60, input({ use: true }));
    expect(game.player.weaponId).toBe(weaponId);
    expect(game.weapons[weaponId]!.ammo).toBe(0);
  });

  test("coup de poing : le 1er fait vaciller et désarme, le 2e fait éclater", () => {
    const game = new Game(testRoom([enemyAt(0, -1.2)], false));
    game.step(1 / 60, input({ fire: true }));
    const enemy = game.enemies[0]!;
    expect(enemy.state).toBe("stagger");
    expect(enemy.weaponId).toBe(NO_ID);
    game.step(1 / 60, input({ fire: true }));
    expect(enemy.state).toBe("dead");
  });
});

describe("arme en main dès la construction", () => {
  test("une arme donnée apparaît dans la main de son porteur", () => {
    const game = new Game(testRoom([enemyAt(3, -6)]));
    const enemy = game.enemies[0]!;
    const enemyWeapon = game.weapons[enemy.weaponId]!;
    expect(enemyWeapon.pos.x).toBeCloseTo(enemy.pos.x, 6);
    expect(enemyWeapon.pos.y).toBeCloseTo(enemy.pos.y + ENEMY.handHeight, 6);
    expect(enemyWeapon.pos.z).toBeCloseTo(enemy.pos.z, 6);
    const playerWeapon = game.weapons[game.player.weaponId]!;
    expect(playerWeapon.pos.x).toBeCloseTo(game.player.pos.x, 6);
    expect(playerWeapon.pos.y).toBeCloseTo(game.player.pos.y + PLAYER.chest, 6);
    expect(playerWeapon.pos.z).toBeCloseTo(game.player.pos.z, 6);
  });
});
