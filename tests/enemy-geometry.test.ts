import { describe, expect, test } from "bun:test";
import { FACETS, segmentMesh } from "../src/render/enemy-geometry";
import { BODY, SEGMENT, SEGMENT_COUNT, SEGMENT_LENGTH } from "../src/render/enemy-pose";

// Boîte attendue de chaque segment, dans son repère (axe Y, −Z vers l'avant) : demi-largeur maximale,
// profondeur (avant, arrière), et combien le segment peut dépasser de ses articulations (bas, haut).
interface ExpectedBox {
  halfX: number;
  front: number;
  back: number;
  below: number;
  above: number;
}

const EXPECTED: Record<number, ExpectedBox> = {
  // La tête ne dépasse pas sa taille en largeur ; le cou descend dans les trapèzes.
  [SEGMENT.head]: { halfX: BODY.headSize / 2, front: 0.13, back: 0.13, below: 0.08, above: 0.03 },
  // Le torse ne dépasse pas l'axe des bras ; le bassin couvre le haut des cuisses.
  [SEGMENT.torso]: { halfX: BODY.shoulderX, front: 0.15, back: 0.14, below: 0.08, above: 0.06 },
  [SEGMENT.upperArmL]: { halfX: 0.08, front: 0.08, back: 0.08, below: 0.04, above: 0.06 },
  [SEGMENT.upperArmR]: { halfX: 0.08, front: 0.08, back: 0.08, below: 0.04, above: 0.06 },
  [SEGMENT.forearmL]: { halfX: 0.06, front: 0.06, back: 0.06, below: 0.08, above: 0.04 },
  [SEGMENT.forearmR]: { halfX: 0.06, front: 0.06, back: 0.06, below: 0.08, above: 0.04 },
  // Une cuisse ne passe pas l'axe du corps ; le pied part vers l'avant ; la semelle est au bout exact de la jambe.
  [SEGMENT.legL]: { halfX: BODY.hipX, front: 0.17, back: 0.11, below: 0, above: 0.06 },
  [SEGMENT.legR]: { halfX: BODY.hipX, front: 0.17, back: 0.11, below: 0, above: 0.06 },
};

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

function bounds(positions: Float32Array): Bounds {
  const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    const z = positions[i + 2]!;
    b.minX = Math.min(b.minX, x);
    b.maxX = Math.max(b.maxX, x);
    b.minY = Math.min(b.minY, y);
    b.maxY = Math.max(b.maxY, y);
    b.minZ = Math.min(b.minZ, z);
    b.maxZ = Math.max(b.maxZ, z);
  }
  return b;
}

// Demi-largeur (|x| max) des sommets dont la hauteur tombe dans [y0, y1].
function halfWidth(positions: Float32Array, y0: number, y1: number): number {
  let w = 0;
  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1]!;
    if (y >= y0 && y <= y1) w = Math.max(w, Math.abs(positions[i]!));
  }
  return w;
}

describe("corps des ennemis façon cristal (tâche 9, spec 5.6 et 6.2)", () => {
  test("la géométrie est déterministe : deux appels rendent les mêmes sommets et les mêmes teintes", () => {
    for (let s = 0; s < SEGMENT_COUNT; s++) {
      const a = segmentMesh(s);
      const b = segmentMesh(s);
      expect(Array.from(b.positions)).toEqual(Array.from(a.positions));
      expect(Array.from(b.brightness)).toEqual(Array.from(a.brightness));
    }
  });

  test("chaque segment reste dans sa boîte attendue et va d'une articulation à l'autre (pas de trou aux jointures)", () => {
    for (let s = 0; s < SEGMENT_COUNT; s++) {
      const box = EXPECTED[s]!;
      const half = SEGMENT_LENGTH[s]! / 2;
      const b = bounds(segmentMesh(s).positions);
      expect(Math.max(-b.minX, b.maxX)).toBeLessThanOrEqual(box.halfX);
      expect(-b.minZ).toBeLessThanOrEqual(box.front);
      expect(b.maxZ).toBeLessThanOrEqual(box.back);
      expect(b.minY).toBeGreaterThanOrEqual(-half - box.below - 1e-6);
      expect(b.maxY).toBeLessThanOrEqual(half + box.above);
      // Le segment couvre ses deux articulations.
      expect(b.minY).toBeLessThanOrEqual(-half + 1e-6);
      expect(b.maxY).toBeGreaterThanOrEqual(half);
    }
  });

  test("la semelle est plate, au bout exact de la jambe : debout, les pieds touchent le sol sans s'y enfoncer", () => {
    for (const leg of [SEGMENT.legL, SEGMENT.legR]) {
      const { positions } = segmentMesh(leg);
      const sole = -BODY.legLength / 2;
      expect(bounds(positions).minY).toBeCloseTo(sole, 6);
      // Au moins un triangle entier au ras du sol : une vraie semelle, pas une pointe.
      let flat = 0;
      for (let o = 0; o < positions.length; o += 9) {
        if ([1, 4, 7].every((k) => Math.abs(positions[o + k]! - sole) < 1e-6)) flat++;
      }
      expect(flat).toBeGreaterThan(3);
    }
  });

  test("silhouette anatomique : épaules plus larges que la taille, cuisses plus épaisses que les mollets, avant-bras effilés", () => {
    const torso = segmentMesh(SEGMENT.torso).positions;
    expect(halfWidth(torso, 0.15, 0.24)).toBeGreaterThan(1.4 * halfWidth(torso, -0.08, 0));
    for (const leg of [SEGMENT.legL, SEGMENT.legR]) {
      const p = segmentMesh(leg).positions;
      expect(halfWidth(p, 0.25, 0.42)).toBeGreaterThan(1.3 * halfWidth(p, -0.15, -0.05));
    }
    for (const forearm of [SEGMENT.forearmL, SEGMENT.forearmR]) {
      const p = segmentMesh(forearm).positions;
      expect(halfWidth(p, 0.04, 0.14)).toBeGreaterThan(1.2 * halfWidth(p, -0.13, -0.1));
    }
  });

  test("chaque segment est un volume fermé, toutes ses facettes tournées vers l'extérieur", () => {
    for (let s = 0; s < SEGMENT_COUNT; s++) {
      const { positions } = segmentMesh(s);
      const edges = new Map<string, number>();
      const key = (o: number) => `${positions[o]},${positions[o + 1]},${positions[o + 2]}`;
      let volume = 0;
      for (let o = 0; o < positions.length; o += 9) {
        const v = [key(o), key(o + 3), key(o + 6)];
        for (let k = 0; k < 3; k++) {
          const edge = `${v[k]}>${v[(k + 1) % 3]}`;
          edges.set(edge, (edges.get(edge) ?? 0) + 1);
        }
        // Volume signé du tétraèdre (origine, a, b, c).
        const [ax, ay, az, bx, by, bz, cx, cy, cz] = Array.from(positions.subarray(o, o + 9));
        volume += (ax! * (by! * cz! - bz! * cy!) - ay! * (bx! * cz! - bz! * cx!) + az! * (bx! * cy! - by! * cx!)) / 6;
      }
      // Fermé et orienté : chaque arête orientée apparaît une fois, et son inverse une fois.
      for (const [edge, count] of edges) {
        expect(count).toBe(1);
        const [from, to] = edge.split(">");
        expect(edges.get(`${to}>${from}`)).toBe(1);
      }
      // Faces tournées vers l'extérieur : le volume signé est positif.
      expect(volume).toBeGreaterThan(0);
    }
  });

  test("chaque facette a sa teinte : l'orange à ±12 %, une part de facettes sombres, quelques éclats vers threat-hot", () => {
    let facets = 0;
    let dark = 0;
    let glints = 0;
    for (let s = 0; s < SEGMENT_COUNT; s++) {
      const { brightness, glint } = segmentMesh(s);
      expect(glint.length).toBe(brightness.length);
      let min = Infinity;
      let max = -Infinity;
      for (let f = 0; f < brightness.length; f++) {
        const b = brightness[f]!;
        min = Math.min(min, b);
        max = Math.max(max, b);
        // Jamais noire ni blanche : la facette la plus sombre garde darkMin de l'orange.
        expect(b).toBeGreaterThanOrEqual(FACETS.darkMin - 1e-6);
        expect(b).toBeLessThanOrEqual(1 + FACETS.tint + 1e-6);
        if (b < 1 - FACETS.tint) dark++;
        // Un éclat est franc (au moins glintMin de threat-hot) ou absent.
        const g = glint[f]!;
        expect(g === 0 || (g >= FACETS.glintMin - 1e-6 && g <= 1 + 1e-6)).toBe(true);
        if (g > 0) glints++;
      }
      // Les facettes d'un même segment varient vraiment.
      expect(max - min).toBeGreaterThan(FACETS.tint);
      facets += brightness.length;
    }
    // Sur tout le corps, les parts tirées au hasard restent proches des parts voulues (à un facteur 2 près).
    expect(dark / facets).toBeGreaterThan(FACETS.darkShare / 2);
    expect(dark / facets).toBeLessThan(FACETS.darkShare * 2);
    expect(glints / facets).toBeGreaterThan(FACETS.glintShare / 2);
    expect(glints / facets).toBeLessThan(FACETS.glintShare * 2);
  });

  test("budget : moins de 2 000 triangles par ennemi", () => {
    let triangles = 0;
    for (let s = 0; s < SEGMENT_COUNT; s++) triangles += segmentMesh(s).positions.length / 9;
    expect(triangles).toBeLessThan(2000);
  });
});
