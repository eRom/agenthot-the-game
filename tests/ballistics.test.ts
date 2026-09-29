import { describe, expect, test } from "bun:test";
import { BULLET, PLAYER_ID } from "../src/sim/entities";
import { Game } from "../src/sim/game";
import { aabb } from "../src/sim/geometry";
import { Rng } from "../src/sim/rng";
import { updateBullets, updateWeapons } from "../src/sim/projectile-system";
import { normalize, vec3 } from "../src/sim/vec3";
import { enemyAt, input, run, testRoom } from "./helpers";

describe("balles (AC-3)", () => {
  test("1 000 balles à 45 m/s ne traversent jamais un mur de 5 cm", () => {
    const room = testRoom([]);
    // Mur fin en x = 0, largement plus grand que la zone de tir.
    room.boxes.push(aabb(-0.025, 0, -10, 0.025, 5, 10));
    const game = new Game(room);
    const rng = new Rng(42);
    const origin = vec3();
    const dir = vec3();
    let crossings = 0;
    let impacts = 0;
    for (let shot = 0; shot < 1000; shot++) {
      for (const b of game.bullets) b.active = false;
      origin.x = -rng.range(0.5, 8);
      origin.y = rng.range(0.5, 4);
      origin.z = rng.range(-5, 5);
      dir.x = 1;
      dir.y = rng.range(-0.1, 0.1);
      dir.z = rng.range(-0.3, 0.3);
      normalize(dir, dir);
      game.spawnBullet(origin, dir, PLAYER_ID);
      const bullet = game.bullets.find((b) => b.active)!;
      const dt = rng.range(1 / 240, 1 / 30);
      for (let i = 0; i < 200 && bullet.active; i++) {
        game.events.clear();
        updateBullets(game, dt);
        for (let k = 0; k < game.events.count; k++) if (game.events.items[k]!.type === "bulletImpact") impacts++;
      }
      if (bullet.pos.x > 0.025 + BULLET.radius) crossings++;
    }
    expect(crossings).toBe(0);
    expect(impacts).toBe(1000);
  });

  test("une balle du joueur tue un ennemi sur sa trajectoire", () => {
    const game = new Game(testRoom([enemyAt(0, -6)]));
    const log = run(game, (frame) => input({ fire: frame === 0 }), (g) => g.status !== "playing", 5);
    expect(log.some((e) => e.type === "enemyKilled")).toBe(true);
    expect(game.status).toBe("won");
  });

  test("tirer collé à un mur fin : la balle s'écrase sur le mur", () => {
    // Mur de 5 cm dont la face proche est à 0,30 m de l'œil du joueur (en z = 0, regard vers -Z).
    const room = testRoom([enemyAt(0, -4, false)]);
    room.boxes.push(aabb(-10, 0, -0.35, 10, 5, -0.3));
    const game = new Game(room);
    const log = run(game, (frame) => input({ fire: frame === 0 }), () => false, 2);
    expect(log.some((e) => e.type === "bulletImpact")).toBe(true);
    expect(log.some((e) => e.type === "enemyKilled")).toBe(false);
    expect(game.enemies[0]!.state).not.toBe("dead");
  });

  test("un chargeur vide fait un clic sec, sans balle", () => {
    const game = new Game(testRoom([enemyAt(10, -14)]));
    const weapon = game.weapons[game.player.weaponId]!;
    weapon.ammo = 0;
    game.step(1 / 60, input({ fire: true }));
    const types = Array.from({ length: game.events.count }, (_, i) => game.events.items[i]!.type);
    expect(types).toContain("dryFire");
    expect(types).not.toContain("shot");
    expect(game.bullets.every((b) => !b.active || b.ownerId !== PLAYER_ID)).toBe(true);
  });

  test("une arme qui retombe sur la passerelle s'y pose, au lieu de rester coincée en vol", () => {
    const room = testRoom([]);
    const catwalk = aabb(-2, 3.4, -2, 2, 3.5, 2);
    room.boxes.push(catwalk);
    const game = new Game(room);
    const w = game.allocateWeapon()!;
    w.state = "flying";
    w.pos.x = 0;
    w.pos.y = 4.5;
    w.pos.z = 0;
    w.vel.x = 0.5;
    w.vel.y = -2;
    w.vel.z = 0;
    for (let i = 0; i < 120; i++) updateWeapons(game, 1 / 60);
    expect(game.weapons[w.id]!.state).toBe("ground");
    expect(w.pos.y).toBeCloseTo(catwalk.max.y + 0.15, 5);
  });
});
