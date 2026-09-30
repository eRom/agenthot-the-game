import { describe, expect, test } from "bun:test";
import { ROOMS, findRoom } from "../src/rooms/registry";
import { room01 } from "../src/rooms/room-01-datacenter";
import { ENEMY, PLAYER, PLAYER_ID, isAlive } from "../src/sim/entities";
import { Game } from "../src/sim/game";
import { Rng } from "../src/sim/rng";
import { FRAME, enemyAt, input, testRoom } from "./helpers";

describe("jamais de tir surprise (AC-5)", () => {
  test("sur 50 parties aléatoires, chaque tir ennemi suit au moins 0,4 s de visée continue", () => {
    const rng = new Rng(7);
    let shotsChecked = 0;
    for (let gameIndex = 0; gameIndex < 50; gameIndex++) {
      const game = new Game(room01);
      const aimStart = new Map<number, number>();
      let moveX = 0;
      let moveZ = 0;
      for (let frame = 0; frame < 60 * 20 && game.status === "playing"; frame++) {
        if (frame % 30 === 0) {
          moveX = Math.floor(rng.range(-1, 2));
          moveZ = Math.floor(rng.range(-1, 2));
        }
        game.step(
          1 / 60,
          input({ moveX, moveZ, lookDX: rng.range(-0.05, 0.05), lookPixels: rng.range(0, 20), fire: rng.next() < 0.02 }),
        );
        for (let i = 0; i < game.events.count; i++) {
          const e = game.events.items[i]!;
          if (e.type !== "shot" || e.ownerId === PLAYER_ID) continue;
          const start = aimStart.get(e.ownerId);
          expect(start).toBeDefined();
          expect(game.simTime - start! + 1e-9).toBeGreaterThanOrEqual(0.4);
          shotsChecked++;
        }
        for (const enemy of game.enemies) {
          if (enemy.state === "aim") {
            if (!aimStart.has(enemy.id)) aimStart.set(enemy.id, game.simTime);
          } else {
            aimStart.delete(enemy.id);
          }
        }
      }
    }
    expect(shotsChecked).toBeGreaterThan(20);
  });
});

describe("déroulé de la salle 1", () => {
  test("au départ : 3 ennemis, pistolet de 4 balles en main", () => {
    const game = new Game(room01);
    expect(game.aliveEnemyCount()).toBe(3);
    expect(game.weapons[game.player.weaponId]!.ammo).toBe(4);
  });

  test("quand il reste 2 ennemis, 2 autres sortent de 2 baies qui explosent", () => {
    const game = new Game(room01);
    const first = game.enemies.find(isAlive)!;
    game.killEnemy(first, first.pos);
    game.step(1 / 60, input());
    expect(game.aliveEnemyCount()).toBe(4);
    const bursts = room01.spawns.filter((s) => s.burstBoxIndex !== undefined).map((s) => s.burstBoxIndex!);
    expect(bursts.length).toBe(2);
    for (const index of bursts) expect(game.boxEnabled[index]).toBe(false);
  });

  test("les 5 ennemis éclatés = victoire", () => {
    const game = new Game(room01);
    for (let round = 0; round < 3; round++) {
      for (const e of game.enemies) if (isAlive(e)) game.killEnemy(e, e.pos);
      game.step(1 / 60, input());
    }
    expect(game.status).toBe("won");
  });

  test("après une mort, reset remet la salle d'origine", () => {
    const game = new Game(room01);
    game.killEnemy(game.enemies.find(isAlive)!, game.player.pos);
    game.step(1 / 60, input());
    game.killPlayer(game.player.pos);
    expect(game.status).toBe("dead");
    game.reset();
    expect(game.status).toBe("playing");
    expect(game.aliveEnemyCount()).toBe(3);
    expect(game.boxEnabled.every(Boolean)).toBe(true);
    expect(game.weapons[game.player.weaponId]!.ammo).toBe(4);
    expect(game.shatter.shards.every((s) => !s.active)).toBe(true);
  });

  test("le joueur qui force contre un coin de baies ne rentre jamais dedans", () => {
    const game = new Game(room01);
    // Vers l'avant-gauche en diagonale : droit dans l'angle d'un tronçon de baies.
    for (let frame = 0; frame < 60 * 4 && game.status === "playing"; frame++) {
      game.step(FRAME, input({ moveZ: 1, moveX: -1 }));
      const p = game.player.pos;
      for (let i = 0; i < room01.boxes.length; i++) {
        const box = room01.boxes[i]!;
        if (!game.boxEnabled[i] || box.min.y > 1) continue;
        // Distance en XZ du centre du joueur au rectangle de la baie : jamais moins que le rayon.
        const cx = Math.min(Math.max(p.x, box.min.x), box.max.x);
        const cz = Math.min(Math.max(p.z, box.min.z), box.max.z);
        expect(Math.hypot(p.x - cx, p.z - cz)).toBeGreaterThanOrEqual(PLAYER.radius - 1e-6);
      }
    }
  });

  test("un ennemi sans ligne de vue contourne les baies par le graphe", () => {
    const game = new Game(room01);
    const path = new Int32Array(room01.nav.nodes.length);
    // Du fond de l'allée gauche à l'entrée de l'allée droite.
    const length = game.nav.findPath(room01.nav.nodes[1]!, room01.nav.nodes[13]!, path);
    expect(length).toBeGreaterThan(1);
    expect(path[length - 1]).toBe(13);
  });
});

describe("salles (AC-16)", () => {
  test("le registre expose la salle 1 jouable et la salle 2 verrouillée", () => {
    const first = findRoom("room-01");
    expect(first?.status).toBe("playable");
    expect(first?.definition).toBeDefined();
    expect(findRoom("room-02")?.status).toBe("locked");
    expect(findRoom("does-not-exist")).toBeUndefined();
    expect(new Set(ROOMS.map((r) => r.id)).size).toBe(ROOMS.length);
  });

  test("une salle de test minimale se joue jusqu'à la victoire sans toucher au moteur", () => {
    const game = new Game(testRoom([enemyAt(0, -6)]));
    for (let frame = 0; frame < 600 && game.status === "playing"; frame++) {
      game.step(FRAME, input({ fire: frame === 0 }));
    }
    expect(game.status).toBe("won");
  });
});

describe("plafond invisible de la salle 1 (tâche 9, M1)", () => {
  test("une balle tirée à la verticale n'est arrêtée qu'à la hauteur des murs, jamais plus bas", () => {
    const game = new Game(room01);
    game.player.pitch = PLAYER.maxPitch;
    let impactY = -1;
    for (let frame = 0; frame < 60 * 5 && impactY < 0; frame++) {
      // Le joueur marche sur place pour que le temps s'écoule.
      game.step(FRAME, input({ fire: frame === 0, moveX: (frame >> 4) & 1 ? 1 : -1 }));
      for (let i = 0; i < game.events.count; i++) {
        const e = game.events.items[i]!;
        if (e.type === "bulletImpact" && e.ownerId === PLAYER_ID) impactY = e.pos.y;
      }
    }
    const wallHeight = room01.interior!.height;
    expect(impactY).toBeGreaterThan(wallHeight - 0.1);
    expect(impactY).toBeLessThanOrEqual(wallHeight);
  });

  test("le plafond est déclaré caché (hors des baies) et passe au-dessus de toute tête", () => {
    const hidden = room01.hiddenBoxIndices ?? [];
    expect(hidden.length).toBeGreaterThan(0);
    for (const index of hidden) {
      expect(room01.rackBoxIndices).not.toContain(index);
      // Au-dessus de toute tête : ennemi de la passerelle (dalle à 3,5 m) compris.
      expect(room01.boxes[index]!.min.y).toBeGreaterThanOrEqual(3.5 + ENEMY.height);
    }
  });
});
