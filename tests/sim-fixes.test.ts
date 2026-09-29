import { describe, expect, test } from "bun:test";
import { ReplayPlayer } from "../src/replay/player";
import { ReplayRecorder } from "../src/replay/recorder";
import { NO_ID, PLAYER_ID } from "../src/sim/entities";
import { Game } from "../src/sim/game";
import { aabb } from "../src/sim/geometry";
import { SHATTER, ShatterSystem, type Shard } from "../src/sim/shatter";
import { set, vec3 } from "../src/sim/vec3";
import { createWorldView, writeGameView } from "../src/sim/view";
import { room01 } from "../src/rooms/room-01-datacenter";
import type { Enemy } from "../src/sim/entities";
import { playerEye } from "../src/sim/player-system";
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

describe("éclats sur la passerelle : le câblage du jeu et du replay (plan 2)", () => {
  const DECK_TOP = 3.5;

  // Salle de test avec une passerelle de 12 × 12 m ; un ennemi désarmé y tient debout,
  // un second, loin, garde la partie en cours pendant que les éclats retombent.
  function deckRoom() {
    const room = testRoom([{ ...enemyAt(0, -3, false, false), pos: vec3(0, DECK_TOP, -3) }, enemyAt(10, -12, false)]);
    room.boxes.push(aabb(-6, 3.4, -6, 6, DECK_TOP, 6));
    return room;
  }

  function shardsOnDeck(shards: readonly Shard[]): Shard[] {
    return shards.filter((s) => s.active && Math.abs(s.pos.x) < 6 && Math.abs(s.pos.z) < 6);
  }

  function expectLandedOnDeck(shards: readonly Shard[]): void {
    const onDeck = shardsOnDeck(shards);
    expect(onDeck.length).toBeGreaterThan(SHATTER.shardsPerBody / 2);
    for (const s of onDeck) expect(s.pos.y).toBeGreaterThanOrEqual(DECK_TOP - 0.01);
  }

  // Tue l'ennemi de la passerelle par l'API publique, enregistre la partie, puis laisse
  // les éclats retomber jusqu'au repos.
  function killAndRecord(game: Game): ReplayRecorder {
    const recorder = new ReplayRecorder();
    const view = createWorldView(game.room.boxes.length, game.shatter.shards);
    writeGameView(game, view);
    recorder.capture(game.simTime, view, true);
    for (let frame = 0; frame < 60 * 60; frame++) {
      game.step(FRAME, input());
      // La mort est provoquée après le pas, pour que ses événements soient enregistrés avant le pas suivant.
      if (frame === 0) game.killEnemy(game.enemies[0]!, vec3());
      writeGameView(game, view);
      recorder.recordEvents(game.events);
      recorder.capture(game.simTime, view, game.status !== "playing");
      if (frame > 0 && !game.shatter.shards.some((s) => s.active && !s.resting)) break;
    }
    return recorder;
  }

  test("dans la partie, les éclats d'un ennemi tué sur la passerelle se posent dessus", () => {
    const game = new Game(deckRoom());
    killAndRecord(game);
    expect(game.status).toBe("playing");
    expectLandedOnDeck(game.shatter.shards);
  });

  test("dans le replay, les éclats rejoués se posent aussi sur la passerelle", () => {
    const game = new Game(deckRoom());
    const recorder = killAndRecord(game);
    const replay = new ReplayPlayer(recorder, game.room);
    while (!replay.finished) replay.update(FRAME);
    expectLandedOnDeck(replay.shatter.shards);
  });
});

describe("éclats plafonnés à 5 m/s (spec 5.8, décision de Romain du 2026-09-29)", () => {
  // Les éclats d'un même tirage (même graine) ne diffèrent d'un impact nul que par la part d'impact :
  // v(impact) - v(nul) = part d'impact, éclat par éclat.
  function shareOf(impact: ReturnType<typeof vec3>): { x: number; y: number; z: number }[] {
    const hit = new ShatterSystem();
    const none = new ShatterSystem();
    hit.spawnBody(vec3(0, 0, 0), 1.8, 0.3, impact, 7, 0);
    none.spawnBody(vec3(0, 0, 0), 1.8, 0.3, vec3(), 7, 0);
    return hit.shards
      .filter((s) => s.active)
      .map((s, i) => ({ x: s.vel.x - none.shards[i]!.vel.x, y: s.vel.y - none.shards[i]!.vel.y, z: s.vel.z - none.shards[i]!.vel.z }));
  }

  test("une balle à 45 m/s ne donne que 5 m/s de part d'impact, dans son sens", () => {
    const shares = shareOf(vec3(45, 0, 0));
    expect(shares.length).toBe(SHATTER.shardsPerBody);
    for (const v of shares) {
      expect(v.x).toBeCloseTo(SHATTER.maxImpactSpeed, 6);
      expect(v.y).toBeCloseTo(0, 6);
      expect(v.z).toBeCloseTo(0, 6);
    }
  });

  test("le plafond garde la direction de l'impact", () => {
    // Impact de norme 50 : part brute 30 m/s, ramenée à 5 en gardant le rapport 3:4.
    for (const v of shareOf(vec3(30, 0, 40))) {
      expect(v.x).toBeCloseTo(3, 6);
      expect(v.z).toBeCloseTo(4, 6);
    }
  });

  test("sous le plafond, la part d'impact reste 0,6 × l'impact", () => {
    // 5 m/s d'impact : part de 3 m/s, sous le plafond.
    for (const v of shareOf(vec3(0, 0, -5))) {
      expect(v.z).toBeCloseTo(-5 * SHATTER.impactShare, 6);
      expect(v.x).toBeCloseTo(0, 6);
    }
  });

  // Vise le buste de l'ennemi depuis l'œil du joueur (lacet 0 = -Z, tangage positif = vers le haut).
  function aimAt(game: Game, enemy: Enemy): void {
    const eye = playerEye(game, vec3());
    const p = game.player;
    p.yaw = Math.atan2(-(enemy.pos.x - eye.x), -(enemy.pos.z - eye.z));
    p.pitch = Math.atan2(enemy.pos.y + 1.2 - eye.y, Math.hypot(enemy.pos.x - eye.x, enemy.pos.z - eye.z));
  }

  // Un vrai tir du joueur (touche de tir, balle à 45 m/s) qui tue l'ennemi, puis les éclats retombent jusqu'au repos.
  function shootAndSettle(game: Game, enemy: Enemy): Shard[] {
    aimAt(game, enemy);
    game.step(FRAME, input({ fire: true }));
    run(game, () => input(), () => enemy.state === "dead", 5);
    expect(enemy.state).toBe("dead");
    for (let i = 0; i < 60 * 20 && game.shatter.shards.some((s) => s.active && !s.resting); i++) {
      game.shatter.step(FRAME, game.room.boxes, game.boxEnabled);
    }
    return game.shatter.shards.filter((s) => s.active);
  }

  test("tué par une vraie balle au centre de la salle 1, l'ennemi éclate dans la salle", () => {
    const room = { ...room01, spawns: [{ pos: vec3(0, 0, 0), yaw: Math.PI, armed: false, mobile: false, trigger: { kind: "start" as const } }] };
    const game = new Game(room);
    const shards = shootAndSettle(game, game.enemies[0]!);
    expect(shards.length).toBe(SHATTER.shardsPerBody);
    for (const s of shards) {
      expect(Math.abs(s.pos.x)).toBeLessThanOrEqual(12);
      expect(Math.abs(s.pos.z)).toBeLessThanOrEqual(8);
    }
  });
});
