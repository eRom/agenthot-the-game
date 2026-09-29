import { describe, expect, test } from "bun:test";
import { aabb, pushCircleOutOfAabbs, segmentBlocked, sweepSphereAabb, sweepSphereCapsule } from "../src/sim/geometry";
import { vec3 } from "../src/sim/vec3";

describe("géométrie", () => {
  const box = aabb(-1, 0, -1, 1, 2, 1);

  test("une sphère qui balaie vers une boîte la touche à la bonne fraction du trajet", () => {
    const t = sweepSphereAabb(vec3(-5, 1, 0), vec3(5, 1, 0), 0, box);
    expect(t).toBeCloseTo(0.4, 5);
  });

  test("le rayon de la sphère avance le contact", () => {
    const t = sweepSphereAabb(vec3(-5, 1, 0), vec3(5, 1, 0), 0.5, box);
    expect(t).toBeCloseTo(0.35, 5);
  });

  test("un segment qui passe à côté ne touche pas", () => {
    expect(sweepSphereAabb(vec3(-5, 1, 3), vec3(5, 1, 3), 0.1, box)).toBe(-1);
  });

  test("une sphère touche une capsule verticale qu'elle frôle à moins de la somme des rayons", () => {
    const base = vec3(0, 0, 0);
    expect(sweepSphereCapsule(vec3(-5, 1, 0.5), vec3(5, 1, 0.5), 0.1, base, 1.8, 0.45)).toBeGreaterThanOrEqual(0);
    expect(sweepSphereCapsule(vec3(-5, 1, 0.6), vec3(5, 1, 0.6), 0.1, base, 1.8, 0.45)).toBe(-1);
  });

  test("un cercle qui entre dans une boîte en ressort par le côté le plus proche", () => {
    const pos = vec3(1.1, 0, 0);
    pushCircleOutOfAabbs(pos, 0.3, 1.8, [box]);
    expect(pos.x).toBeCloseTo(1.3, 5);
    expect(pos.z).toBeCloseTo(0, 5);
  });

  test("une boîte plus haute que le cercle (passerelle) ne le repousse pas", () => {
    const pos = vec3(0, 0, 0);
    pushCircleOutOfAabbs(pos, 0.3, 1.8, [aabb(-1, 3.4, -1, 1, 3.5, 1)]);
    expect(pos.x).toBe(0);
  });

  test("une boîte désactivée ne bloque plus la ligne de vue", () => {
    const a = vec3(-5, 1, 0);
    const b = vec3(5, 1, 0);
    expect(segmentBlocked(a, b, [box])).toBe(true);
    expect(segmentBlocked(a, b, [box], [false])).toBe(false);
  });
});
