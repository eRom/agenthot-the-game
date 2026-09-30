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
