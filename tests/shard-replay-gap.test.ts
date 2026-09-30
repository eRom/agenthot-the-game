import { describe, expect, test } from "bun:test";
import { room01 } from "../src/rooms/room-01-datacenter";
import { aabb } from "../src/sim/geometry";
import { SHATTER, ShatterSystem } from "../src/sim/shatter";
import { vec3 } from "../src/sim/vec3";

// Le jeu fait avancer les éclats par petits pas (temps ralenti : 1/60 × 0,03 s de simulation par image),
// le replay par pas d'une image (1/60 s). Les deux doivent poser les éclats au même endroit.
const SLOW_STEP = (1 / 60) * 0.03;
const REPLAY_STEP = 1 / 60;

// Écarts (m) entre les éclats de deux systèmes identiques, avancés de `seconds` avec deux pas différents.
function restGaps(spawn: (s: ShatterSystem) => void, seconds: number): number[] {
  const slow = new ShatterSystem();
  const fast = new ShatterSystem();
  spawn(slow);
  spawn(fast);
  const enabled = room01.boxes.map(() => true);
  for (let t = 0; t < seconds; t += SLOW_STEP) slow.step(SLOW_STEP, room01.boxes, enabled);
  for (let t = 0; t < seconds; t += REPLAY_STEP) fast.step(REPLAY_STEP, room01.boxes, enabled);
  const gaps: number[] = [];
  for (let i = 0; i < slow.shards.length; i++) {
    const a = slow.shards[i]!;
    const b = fast.shards[i]!;
    if (!a.active) continue;
    gaps.push(Math.hypot(a.pos.x - b.pos.x, a.pos.y - b.pos.y, a.pos.z - b.pos.z));
  }
  return gaps.sort((x, y) => x - y);
}

describe("éclats : même trajet au ralenti et au replay (plan 3, entrée 26)", () => {
  // Mesuré avant correctif (2026-09-29) : 95 % des éclats à moins de 10 cm en allée, de 2,7 m sur la passerelle
  // (un éclat qui tombe ou non de la passerelle). Après : 5 mm au plus.
  test("un ennemi éclaté en pleine allée : chaque éclat se pose à moins de 1 cm de sa place au replay", () => {
    const gaps = restGaps((s) => s.spawnBody(vec3(0, 0, -2), 1.8, 0.3, vec3(0, 0, -45), 1234, 0), 4);
    expect(gaps.length).toBe(SHATTER.shardsPerBody);
    expect(gaps[gaps.length - 1]!).toBeLessThan(0.01);
  });

  test("un ennemi éclaté sur la passerelle : chaque éclat se pose à moins de 1 cm de sa place au replay", () => {
    const gaps = restGaps((s) => s.spawnBody(vec3(-11, 3.5, -2), 1.8, 0.3, vec3(45, 0, 0), 99, 0), 4);
    expect(gaps.length).toBe(SHATTER.shardsPerBody);
    expect(gaps[gaps.length - 1]!).toBeLessThan(0.01);
  });
});

describe("éclats : jamais sous le sol (plan 3, entrée 26)", () => {
  test("un éclat né dans le bas d'une boîte posée au sol en sort par une face, jamais par-dessous", () => {
    // Boîte large et basse : pour un éclat près du sol, la face la plus proche est celle du dessous.
    const slab = aabb(-2, 0, -2, 2, 1, 2);
    const shatter = new ShatterSystem();
    const s = shatter.shards[0]!;
    s.active = true;
    s.resting = false;
    s.bounced = false;
    s.size = 0.1;
    s.pos.x = 0;
    s.pos.y = 0.02;
    s.pos.z = 0;
    s.vel.x = 0;
    s.vel.y = 0;
    s.vel.z = 0;
    for (let i = 0; i < 600; i++) shatter.step(1 / 60, [slab], [true]);
    expect(s.pos.y).toBeGreaterThanOrEqual(0.05 - 1e-9);
    const inside = s.pos.x > -2 && s.pos.x < 2 && s.pos.y < 1 && s.pos.z > -2 && s.pos.z < 2;
    expect(inside).toBe(false);
  });
});

describe("éclats : un éclat qui remonte à peine du sol ne se fige pas au replay (revue de la tâche 1)", () => {
  // Un éclat rebondi à hauteur de repos (ou presque) avec une petite vitesse montante : à un grand pas (replay),
  // le sol est « touché » dans le pas. Il ne doit ni rester figé en l'air à hauteur de repos, ni finir ailleurs qu'au jeu.
  function launchLow(s: ShatterSystem, restHeightOffset: number, vy: number, bounced: boolean): void {
    const shard = s.shards[0]!;
    shard.active = true;
    shard.resting = false;
    shard.bounced = bounced;
    shard.size = 0.1;
    shard.pos.x = 0;
    shard.pos.y = 0.05 + restHeightOffset;
    shard.pos.z = 0;
    shard.vel.x = 3;
    shard.vel.y = vy;
    shard.vel.z = 0;
  }

  // Le premier contact d'un éclat qui tombe de quelques millimètres le fait rebondir de presque rien (petite vitesse
  // montante à hauteur de repos) : c'est ce rebond minuscule qui figeait l'éclat au replay.
  const cases: [string, number, number, boolean][] = [
    ["qui tombe de 0,5 mm au premier contact", 0.0005, 0, false],
    ["qui tombe de 2 mm au premier contact", 0.002, 0, false],
    ["déjà rebondi, posé à sa hauteur de repos avec une petite vitesse montante", 0, 0.05, true],
  ];
  for (const [label, offset, vy, bounced] of cases) {
    test(`un éclat ${label} finit figé au même endroit au jeu et au replay`, () => {
      const slow = new ShatterSystem();
      const fast = new ShatterSystem();
      launchLow(slow, offset, vy, bounced);
      launchLow(fast, offset, vy, bounced);
      for (let t = 0; t < 4; t += SLOW_STEP) slow.step(SLOW_STEP);
      for (let t = 0; t < 4; t += REPLAY_STEP) fast.step(REPLAY_STEP);
      const a = slow.shards[0]!;
      const b = fast.shards[0]!;
      expect(a.resting).toBe(true);
      expect(b.resting).toBe(true);
      expect(Math.hypot(a.pos.x - b.pos.x, a.pos.y - b.pos.y, a.pos.z - b.pos.z)).toBeLessThan(0.01);
    });
  }
});
