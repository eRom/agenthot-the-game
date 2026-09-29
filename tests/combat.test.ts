import { describe, expect, test } from "bun:test";
import { ENEMY, NO_ID, PLAYER, PLAYER_ID, WEAPON } from "../src/sim/entities";
import { Game } from "../src/sim/game";
import { aabb } from "../src/sim/geometry";
import { distance, vec3 } from "../src/sim/vec3";
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

  test("coup de poing sur un ennemi armé : il vacille et son arme saute dans la main du joueur", () => {
    const game = new Game(testRoom([enemyAt(0, -1.2)], false));
    const enemy = game.enemies[0]!;
    const enemyWeaponId = enemy.weaponId;
    game.step(1 / 60, input({ fire: true }));
    expect(enemy.state).toBe("stagger");
    expect(enemy.weaponId).toBe(NO_ID);
    for (let i = 0; i < 120 && game.player.weaponId === NO_ID; i++) game.step(1 / 60, input());
    expect(game.player.weaponId).toBe(enemyWeaponId);
    expect(game.weapons[enemyWeaponId]!.ammo).toBe(WEAPON.capacity);
  });

  test("coup de poing sur un ennemi désarmé : il éclate", () => {
    const game = new Game(testRoom([enemyAt(0, -1.2, false)], false));
    game.step(1 / 60, input({ fire: true }));
    expect(game.enemies[0]!.state).toBe("dead");
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

describe("visée des tireurs au sol (spec 5.2)", () => {
  test("joueur accroupi immobile : un tireur au sol finit par le toucher", () => {
    const game = new Game(testRoom([enemyAt(0, -4)]));
    const log = run(game, () => input({ crouch: true }), (g) => g.status === "dead", 120);
    expect(log.some((e) => e.type === "playerKilled")).toBe(true);
  });
});

describe("mêlée d'un ennemi désarmé (spec 5.6)", () => {
  test("un ennemi désarmé au sol frappe le joueur après son élan", () => {
    const game = new Game(testRoom([enemyAt(0, -1.0, false, true)], false));
    const log = run(game, () => input(), (g) => g.status === "dead", 60);
    expect(log.some((e) => e.type === "playerKilled")).toBe(true);
  });

  test("un ennemi désarmé sur une passerelle ne frappe pas le joueur en dessous", () => {
    const room = testRoom(
      [{ ...enemyAt(0, -0.8, false, false), pos: vec3(0, 3.5, -0.8) }],
      false,
    );
    room.boxes.push(aabb(-2, 3.4, -2, 2, 3.5, 2));
    const game = new Game(room);
    const log = run(game, () => input(), () => false, 60);
    expect(log.some((e) => e.type === "playerKilled")).toBe(false);
    expect(game.status).toBe("playing");
  });

  test("une baie entre l'ennemi et le joueur bloque le coup", () => {
    const room = testRoom([enemyAt(0, -1.1, false, false)], false);
    room.boxes.push(aabb(-1, 0, -0.75, 1, 2.2, -0.45));
    const game = new Game(room);
    const log = run(game, () => input(), () => false, 60);
    expect(log.some((e) => e.type === "playerKilled")).toBe(false);
    expect(game.status).toBe("playing");
  });
});

describe("coup de poing et décor (spec 5.5)", () => {
  test("un coup de poing ne traverse pas une baie", () => {
    // Ennemi armé à 1,2 m, mais une boîte fine se dresse entre le poing et lui.
    const room = testRoom([enemyAt(0, -1.2)], false);
    room.boxes.push(aabb(-1, 0, -0.7, 1, 2.2, -0.6));
    const game = new Game(room);
    const enemy = game.enemies[0]!;
    game.step(1 / 60, input({ fire: true }));
    expect(enemy.state).not.toBe("stagger");
    expect(enemy.state).not.toBe("dead");
    expect(enemy.weaponId).not.toBe(NO_ID);
  });
});

describe("armes à portée (spec 5.4)", () => {
  // Pose une arme au sol, avec `ammo` balles, en (x, z).
  function dropWeapon(game: Game, ammo: number, x: number, z: number) {
    const w = game.allocateWeapon()!;
    w.ammo = ammo;
    w.state = "ground";
    w.holderId = NO_ID;
    w.pos.x = x;
    w.pos.y = WEAPON.radius;
    w.pos.z = z;
    return w;
  }

  test("E prend l'arme la plus chargée et ne troque jamais une arme pleine contre une vide", () => {
    // Un ennemi désarmé, immobile et loin : sans lui la partie serait gagnée dès la 1re image.
    const game = new Game(testRoom([enemyAt(10, -14, false)]));
    const heldId = game.player.weaponId;
    const empty = dropWeapon(game, 0, 0.3, 0);
    const full = dropWeapon(game, WEAPON.capacity, 1.2, 0);
    expect(game.weapons[heldId]!.ammo).toBe(WEAPON.capacity);
    game.step(1 / 60, input({ use: true }));
    // Il tient déjà 4 balles : rien ne change.
    expect(game.player.weaponId).toBe(heldId);
    expect(empty.state).toBe("ground");
    expect(full.state).toBe("ground");
    // Vidé, il prend l'arme pleine, pas la plus proche.
    game.weapons[heldId]!.ammo = 0;
    game.step(1 / 60, input({ use: true }));
    expect(game.player.weaponId).toBe(full.id);
    expect(game.weapons[heldId]!.state).toBe("ground");
  });

  test("à charge égale, E prend l'arme la plus proche", () => {
    const game = new Game(testRoom([enemyAt(10, -14, false)], false));
    const far = dropWeapon(game, 2, 1.5, 0);
    const near = dropWeapon(game, 2, 0.4, 0);
    game.step(1 / 60, input({ use: true }));
    expect(game.player.weaponId).toBe(near.id);
    expect(far.state).toBe("ground");
  });

  test("une arme captée tire aussitôt, même juste après un tir", () => {
    const game = new Game(testRoom([enemyAt(10, -14, false)]));
    const heldId = game.player.weaponId;
    // Un tir : le temps de recharge est lancé, et l'arme tenue n'a plus que 3 balles.
    game.step(1 / 60, input({ fire: true }));
    expect(game.player.fireCooldown).toBeGreaterThan(0);
    // Une arme pleine à portée : E la prend en échange de l'arme entamée.
    const found = dropWeapon(game, WEAPON.capacity, 0.5, 0);
    game.step(1 / 60, input({ use: true }));
    expect(game.player.weaponId).toBe(found.id);
    expect(game.weapons[heldId]!.state).toBe("ground");
    // Le tir suivant part à l'image même.
    game.step(1 / 60, input({ fire: true }));
    let shots = 0;
    for (let i = 0; i < game.events.count; i++) {
      const ev = game.events.items[i]!;
      if (ev.type === "shot" && ev.ownerId === PLAYER_ID) shots++;
    }
    expect(shots).toBe(1);
  });
});

describe("trait de visée et vacillement (spec 5.6)", () => {
  test("dès sa première image de visée, le trait vise le joueur", () => {
    const game = new Game(testRoom([enemyAt(0, -5)]));
    const enemy = game.enemies[0]!;
    // Un point périmé, comme celui d'une visée précédente.
    enemy.aimPoint.x = 100;
    enemy.aimPoint.y = 100;
    enemy.aimPoint.z = 100;
    let aimDistance = -1;
    run(
      game,
      () => input(),
      (g) => {
        if (enemy.state !== "aim") return false;
        const chest = vec3(g.player.pos.x, g.player.pos.y + PLAYER.chest, g.player.pos.z);
        aimDistance = distance(enemy.aimPoint, chest);
        return true;
      },
      5,
    );
    // La première image en état de visée : le trait vise déjà le torse du joueur.
    expect(aimDistance).toBeGreaterThanOrEqual(0);
    expect(aimDistance).toBeLessThan(1);
  });

  test("à l'apparition, le trait de visée part de l'ennemi et non de l'origine", () => {
    const game = new Game(testRoom([enemyAt(3, -9, false)]));
    const enemy = game.enemies[0]!;
    expect(distance(enemy.aimPoint, enemy.pos)).toBeLessThan(1e-9);
  });

  test("un joueur qui sort de portée pendant la visée n'est pas visé jusqu'au tir", () => {
    const game = new Game(testRoom([enemyAt(0, -7.9)]));
    const enemy = game.enemies[0]!;
    let teleportedAt = -1;
    const log = run(
      game,
      (_, g) => {
        // Dès que la visée commence, le joueur recule à 12 m de l'ennemi.
        if (teleportedAt < 0 && enemy.state === "aim") {
          g.player.pos.z = enemy.pos.z + 12;
          teleportedAt = g.simTime;
        }
        return input();
      },
      (g) => teleportedAt >= 0 && g.simTime - teleportedAt >= 0.5,
      60,
    );
    expect(teleportedAt).toBeGreaterThanOrEqual(0);
    expect(game.simTime - teleportedAt).toBeGreaterThanOrEqual(0.5);
    expect(log.some((e) => e.type === "shot" && e.ownerId !== PLAYER_ID)).toBe(false);
    expect(enemy.state).toBe("approach");
  });

  test("un ennemi vacillant reprend l'approche après 1,5 s", () => {
    // Ennemi désarmé de fait (son arme saute) et immobile, à 5 m.
    const game = new Game(testRoom([enemyAt(0, -5)]));
    const enemy = game.enemies[0]!;
    game.staggerEnemy(enemy, game.player.pos);
    const start = game.simTime;
    let elapsed = -1;
    run(
      game,
      () => input(),
      (g) => {
        if (enemy.state === "stagger") return false;
        elapsed = g.simTime - start;
        return true;
      },
      120,
    );
    expect(enemy.state).toBe("approach");
    expect(elapsed).toBeGreaterThanOrEqual(ENEMY.staggerTime - 1e-6);
  });
});
