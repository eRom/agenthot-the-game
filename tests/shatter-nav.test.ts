import { describe, expect, test } from "bun:test";
import { Navigator } from "../src/sim/nav";
import { SHATTER, ShatterSystem } from "../src/sim/shatter";
import { vec3 } from "../src/sim/vec3";

describe("éclats", () => {
  test("un corps éclate en éclats qui tombent, rebondissent puis se figent au sol", () => {
    const shatter = new ShatterSystem();
    shatter.spawnBody(vec3(0, 0, 0), 1.8, 0.3, vec3(10, 0, 0), 123, 0);
    const active = shatter.shards.filter((s) => s.active);
    expect(active.length).toBe(SHATTER.shardsPerBody);
    for (let i = 0; i < 600; i++) shatter.step(1 / 60);
    for (const s of active) {
      expect(s.resting).toBe(true);
      expect(s.pos.y).toBeCloseTo(s.size * 0.5, 5);
    }
    // L'impact pousse les éclats dans son sens.
    const meanX = active.reduce((sum, s) => sum + s.pos.x, 0) / active.length;
    expect(meanX).toBeGreaterThan(1);
  });

  test("même graine, mêmes éclats : le replay reproduit l'éclatement", () => {
    const a = new ShatterSystem();
    const b = new ShatterSystem();
    a.spawnBody(vec3(1, 0, 2), 1.8, 0.3, vec3(0, 0, -5), 99, 0);
    b.spawnBody(vec3(1, 0, 2), 1.8, 0.3, vec3(0, 0, -5), 99, 0);
    for (let i = 0; i < 30; i++) {
      a.step(1 / 60);
      b.step(1 / 60);
    }
    expect(a.shards.map((s) => s.pos.x)).toEqual(b.shards.map((s) => s.pos.x));
  });

  test("le temps figé fige les éclats", () => {
    const shatter = new ShatterSystem();
    shatter.spawnBody(vec3(0, 0, 0), 1.8, 0.3, vec3(0, 0, 0), 5, 1);
    const before = shatter.shards[0]!.pos.y;
    shatter.step(0);
    expect(shatter.shards[0]!.pos.y).toBe(before);
  });
});

describe("navigation", () => {
  // Graphe en L : 0 - 1 - 2, et 2 - 3.
  const nav = new Navigator({
    nodes: [vec3(0, 0, 0), vec3(5, 0, 0), vec3(10, 0, 0), vec3(10, 0, 5)],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  });

  test("le chemin suit les arêtes du départ jusqu'au but, départ exclu", () => {
    const out = new Int32Array(4);
    const length = nav.findPath(vec3(0.2, 0, 0), vec3(10, 0, 4.8), out);
    expect(Array.from(out.slice(0, length))).toEqual([1, 2, 3]);
  });

  test("déjà sur le nœud du but : un seul point", () => {
    const out = new Int32Array(4);
    expect(nav.findPath(vec3(10, 0, 5), vec3(10.1, 0, 5), out)).toBe(1);
  });
});
