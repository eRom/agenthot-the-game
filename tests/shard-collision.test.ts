import { describe, expect, test } from "bun:test";
import { ReplayPlayer } from "../src/replay/player";
import { ReplayRecorder } from "../src/replay/recorder";
import { room01 } from "../src/rooms/room-01-datacenter";
import type { RoomDefinition } from "../src/rooms/types";
import { Game } from "../src/sim/game";
import { type Aabb, aabb } from "../src/sim/geometry";
import { playerEye } from "../src/sim/player-system";
import { SHATTER, ShatterSystem, type Shard } from "../src/sim/shatter";
import { type Vec3, vec3 } from "../src/sim/vec3";
import { createWorldView, writeGameView } from "../src/sim/view";
import { FRAME, input } from "./helpers";

// Pose un éclat à la main : position, vitesse et taille. Il est actif, en vol, pas encore rebondi.
function place(shatter: ShatterSystem, index: number, pos: Vec3, vel: Vec3, size = 0.1): Shard {
  const s = shatter.shards[index]!;
  s.active = true;
  s.resting = false;
  s.bounced = false;
  s.kind = 0;
  s.size = size;
  s.pos.x = pos.x;
  s.pos.y = pos.y;
  s.pos.z = pos.z;
  s.vel.x = vel.x;
  s.vel.y = vel.y;
  s.vel.z = vel.z;
  s.angVel = 0;
  return s;
}

function settle(shatter: ShatterSystem, boxes: Aabb[], enabled: boolean[] = boxes.map(() => true), seconds = 10): void {
  for (let i = 0; i < seconds * 60; i++) shatter.step(FRAME, boxes, enabled);
}

describe("éclats contre les boîtes du décor : cas de base (plan 2, correctif 3)", () => {
  // Mur épais de 0,5 m entre x = 3 et x = 3,5, haut de 5 m.
  const wall = aabb(3, 0, -5, 3.5, 5, 5);

  test("un éclat lancé contre un mur rebondit : sa vitesse est renversée et réduite du coefficient de restitution", () => {
    const shatter = new ShatterSystem();
    const s = place(shatter, 0, vec3(0, 2, 0), vec3(8, 0, 0));
    // Gravité seule sur y : la vitesse en x ne change qu'au contact.
    for (let i = 0; i < 60 && s.vel.x > 0; i++) shatter.step(FRAME, [wall], [true]);
    expect(s.vel.x).toBeCloseTo(-8 * SHATTER.restitution, 6);
    expect(s.pos.x).toBeLessThan(3);
  });

  test("un éclat très rapide ne traverse pas un mur mince", () => {
    const thin = aabb(3, 0, -5, 3.05, 5, 5);
    const shatter = new ShatterSystem();
    // 90 m/s : 1,5 m par image, soit trente fois l'épaisseur du mur.
    place(shatter, 0, vec3(0, 2, 0), vec3(90, 0, 0));
    settle(shatter, [thin]);
    expect(shatter.shards[0]!.pos.x).toBeLessThan(3);
  });

  test("un éclat qui tombe sur une boîte se pose dessus, à la hauteur de son rayon", () => {
    const table = aabb(-2, 0, -2, 2, 1, 2);
    const shatter = new ShatterSystem();
    const s = place(shatter, 0, vec3(0.5, 3, 0.5), vec3(0, 0, 0), 0.1);
    settle(shatter, [table]);
    expect(s.resting).toBe(true);
    expect(s.pos.y).toBeCloseTo(1 + 0.05, 6);
  });

  test("un éclat qui monte contre le dessous d'une dalle est renvoyé vers le bas", () => {
    const slab = aabb(-5, 3, -5, 5, 3.5, 5);
    const shatter = new ShatterSystem();
    const s = place(shatter, 0, vec3(0, 1, 0), vec3(0, 12, 0));
    for (let i = 0; i < 60 && s.vel.y > 0; i++) shatter.step(FRAME, [slab], [true]);
    expect(s.vel.y).toBeLessThan(0);
    expect(s.pos.y).toBeLessThan(3);
  });

  test("un éclat né dans une boîte en sort par la face la plus proche et ne reste pas dedans", () => {
    const block = aabb(-1, 0, -1, 1, 2, 1);
    const shatter = new ShatterSystem();
    // À 0,1 m de la face +x, en plein milieu de la hauteur.
    const s = place(shatter, 0, vec3(0.9, 1, 0), vec3(0, 0, 0));
    settle(shatter, [block]);
    const inside = s.pos.x > -1 && s.pos.x < 1 && s.pos.y > 0 && s.pos.y < 2 && s.pos.z > -1 && s.pos.z < 1;
    expect(inside).toBe(false);
  });

  // Tâche 9, M2 : au replay, un à-coup d'image donne un grand pas ; la fin du pas passait sous le sol, donc
  // sous le bas d'une baie posée au sol, et l'éclat se figeait dans la baie.
  test("pas de 0,1 s : un éclat qui plonge vers le pied d'une baie rebondit sur sa face et ne se fige pas dedans", () => {
    const rack = aabb(0, 0, 0, 1, 2.2, 1);
    const shatter = new ShatterSystem();
    // Déjà rebondi une fois : le prochain contact avec le sol le fige.
    const s = place(shatter, 0, vec3(-0.3, 0.3, 0.5), vec3(6, -8, 0));
    s.bounced = true;
    for (let i = 0; i < 30 && !s.resting; i++) {
      shatter.step(0.1, [rack], [true]);
      expect(insideBox(s, rack)).toBe(false);
    }
    expect(s.resting).toBe(true);
    expect(s.pos.x).toBeLessThan(0);
  });

  test("une boîte désactivée (baie explosée) n'arrête plus rien", () => {
    const shatter = new ShatterSystem();
    place(shatter, 0, vec3(0, 2, 0), vec3(8, 0, 0));
    settle(shatter, [wall], [false]);
    expect(shatter.shards[0]!.pos.x).toBeGreaterThan(3.5);
  });
});

// Salle 1 réelle, un ennemi tué par un vrai tir du joueur (aucun impact fabriqué), plus un figurant inerte
// loin de la scène qui garde la partie en cours pendant que les éclats retombent.
interface Scenario {
  name: string;
  enemy: Vec3;
  armed: boolean;
  player: Vec3;
}

const SCENARIOS: Scenario[] = [
  { name: "au centre de la salle", enemy: vec3(0, 0, 0), armed: false, player: vec3(0, 0, 6.5) },
  // Le poste réel de la salle 1 : passerelle latérale à 3,5 m.
  { name: "sur la passerelle", enemy: vec3(-11, 3.5, -2), armed: true, player: vec3(0, 0, 6.5) },
  // Sous la passerelle, contre le mur ouest : le tir pousse les éclats dans le mur et vers la dalle.
  { name: "contre le mur ouest, sous la passerelle", enemy: vec3(-11.5, 0, 0), armed: false, player: vec3(-5, 0, 0) },
  // Par le passage entre deux tronçons de baies, contre le mur est.
  { name: "contre le mur est", enemy: vec3(11.5, 0, -0.4), armed: false, player: vec3(5, 0, -0.4) },
  { name: "dans le coin sud-est", enemy: vec3(11.4, 0, 7.4), armed: false, player: vec3(11.4, 0, 0) },
];

function sceneRoom(sc: Scenario): RoomDefinition {
  return {
    ...room01,
    spawns: [
      { pos: sc.enemy, yaw: Math.PI, armed: sc.armed, mobile: false, trigger: { kind: "start" } },
      { pos: vec3(10, 0, -7), yaw: Math.PI, armed: false, mobile: false, trigger: { kind: "start" } },
    ],
  };
}

interface Outcome {
  game: Game;
  replay: ReplayPlayer;
}

// Tue l'ennemi par un vrai tir (touche de tir, balle à 45 m/s), enregistre la partie, puis joue le replay.
// `still` : le joueur reste immobile après le tir (temps au ralenti), au lieu de marcher sur place.
function shootRecordReplay(sc: Scenario, still = false): Outcome {
  const game = new Game(sceneRoom(sc));
  const enemy = game.enemies[0]!;
  const p = game.player;
  p.pos.x = sc.player.x;
  p.pos.y = sc.player.y;
  p.pos.z = sc.player.z;
  const eye = playerEye(game, vec3());
  p.yaw = Math.atan2(-(enemy.pos.x - eye.x), -(enemy.pos.z - eye.z));
  p.pitch = Math.atan2(enemy.pos.y + 1.2 - eye.y, Math.hypot(enemy.pos.x - eye.x, enemy.pos.z - eye.z));

  const recorder = new ReplayRecorder();
  const view = createWorldView(game.room.boxes.length, game.shatter.shards);
  writeGameView(game, view);
  recorder.capture(game.simTime, view, true);
  let killedAt = -1;
  // Immobile, le temps coule à 3 % : il faut plus d'images réelles pour que les éclats retombent.
  const maxFrames = still ? 60 * 1200 : 60 * 120;
  for (let frame = 0; frame < maxFrames; frame++) {
    // Le joueur marche sur place pour que le temps s'écoule à vitesse normale (sauf `still`).
    const moveX = still ? 0 : (frame >> 4) & 1 ? 1 : -1;
    game.step(FRAME, input({ fire: frame === 0, moveX }));
    writeGameView(game, view);
    recorder.recordEvents(game.events);
    recorder.capture(game.simTime, view, false);
    if (killedAt < 0 && enemy.state === "dead") killedAt = frame;
    if (killedAt >= 0 && frame > killedAt && !game.shatter.shards.some((s) => s.active && !s.resting)) break;
  }
  expect(killedAt).toBeGreaterThanOrEqual(0);
  expect(game.status).toBe("playing");
  recorder.capture(game.simTime, view, true);
  const replay = new ReplayPlayer(recorder, game.room);
  while (!replay.finished) replay.update(FRAME);
  // Le replay finit avec l'enregistrement : on laisse retomber ce qui vole encore.
  for (let i = 0; i < 60 * 10; i++) replay.update(FRAME);
  return { game, replay };
}

function activeShards(shatter: ShatterSystem): Shard[] {
  return shatter.shards.filter((s) => s.active);
}

function insideBox(s: Shard, box: Aabb): boolean {
  return (
    s.pos.x > box.min.x && s.pos.x < box.max.x && s.pos.y > box.min.y && s.pos.y < box.max.y && s.pos.z > box.min.z && s.pos.z < box.max.z
  );
}

// Chaque éclat, en partie comme au replay, repose dans la salle, au-dessus du sol et hors des boîtes actives.
function expectShardsInRoom({ game, replay }: Outcome): void {
  for (const [shatter, enabled] of [
    [game.shatter, game.boxEnabled],
    [replay.shatter, replay.view.boxEnabled],
  ] as const) {
    const shards = activeShards(shatter);
    expect(shards.length).toBe(SHATTER.shardsPerBody);
    expect(shards.every((s) => s.resting)).toBe(true);
    for (const s of shards) {
      // Salle : x dans [-12, 12], z dans [-8, 8], au-dessus du sol.
      expect(Math.abs(s.pos.x)).toBeLessThanOrEqual(12);
      expect(Math.abs(s.pos.z)).toBeLessThanOrEqual(8);
      expect(s.pos.y).toBeGreaterThanOrEqual(0);
      game.room.boxes.forEach((box, i) => {
        if (enabled[i]) expect(insideBox(s, box)).toBe(false);
      });
    }
  }
}

describe("éclats dans la salle 1 réelle (plan 2, correctif 3)", () => {
  // Tâche 9, M1 : sans plafond, 5 éclats sur 36 passaient par-dessus le mur de 6 m, derrière la passerelle.
  test("l'ennemi de la passerelle tué depuis (−8 ; 0 ; −0,4), joueur immobile après le tir : aucun éclat hors de la salle", () => {
    const sc: Scenario = { name: "passerelle, joueur immobile", enemy: vec3(-11, 3.5, -2), armed: true, player: vec3(-8, 0, -0.4) };
    expectShardsInRoom(shootRecordReplay(sc, true));
  });

  for (const sc of SCENARIOS) {
    test(`aucun éclat ne sort de la salle ni ne reste dans une boîte : ennemi tué ${sc.name}`, () => {
      expectShardsInRoom(shootRecordReplay(sc));
    });
  }

  // Poste de la passerelle : dalle à y = 3,5 le long du mur ouest.
  test("l'ennemi de la passerelle tué par une vraie balle éclate sur la passerelle, en partie comme dans le replay", () => {
    const { game, replay } = shootRecordReplay(SCENARIOS[1]!);
    const live = activeShards(game.shatter);
    const replayed = activeShards(replay.shatter);
    const onDeck = (shards: Shard[]) => shards.filter((s) => s.pos.y >= 3.5).length;
    // Plus de la moitié des éclats reposent sur la passerelle, dans la partie comme dans le replay.
    expect(onDeck(live)).toBeGreaterThan(live.length / 2);
    expect(onDeck(replayed)).toBeGreaterThan(replayed.length / 2);
    // Le replay retombe au même endroit : mêmes éclats sur la passerelle, à moins de 10 cm près (mesuré : 5 cm).
    // Pas identiques au millimètre : le replay avance en temps réel par pas d'image, la partie en temps de simulation.
    expect(onDeck(replayed)).toBe(onDeck(live));
    for (let i = 0; i < live.length; i++) {
      const a = live[i]!;
      const b = replay.shatter.shards[game.shatter.shards.indexOf(a)]!;
      expect(Math.hypot(a.pos.x - b.pos.x, a.pos.y - b.pos.y, a.pos.z - b.pos.z)).toBeLessThan(0.1);
    }
  });
});
