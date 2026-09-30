// Décor de la salle : ce qui est dessiné tient dans sa boîte de collision (sinon une balle traverserait un tiroir
// visible, ou s'arrêterait dans le vide).
import { describe, expect, test } from "bun:test";
import { rackGeometry, shelfGeometry } from "../src/render/decor";
import { room01 } from "../src/rooms/room-01-datacenter";

const EPSILON = 1e-6;

describe("décor et collisions", () => {
  test("une baie dessinée tient dans la boîte de collision d'une baie", () => {
    const box = room01.boxes[room01.rackBoxIndices[0]!]!;
    const size = { x: box.max.x - box.min.x, y: box.max.y - box.min.y, z: box.max.z - box.min.z };
    const geo = rackGeometry({ depth: size.x, height: size.y, width: size.z });
    geo.computeBoundingBox();
    const bounds = geo.boundingBox!;
    for (const axis of ["x", "y", "z"] as const) {
      expect(bounds.max[axis]).toBeLessThanOrEqual(size[axis] / 2 + EPSILON);
      expect(bounds.min[axis]).toBeGreaterThanOrEqual(-size[axis] / 2 - EPSILON);
    }
    // Elle remplit sa boîte : le châssis touche ses six faces.
    for (const axis of ["x", "y", "z"] as const) expect(bounds.max[axis] - bounds.min[axis]).toBeCloseTo(size[axis], 5);
  });

  test("chaque étagère dessinée tient dans sa boîte de collision", () => {
    const indices = room01.shelfBoxIndices ?? [];
    expect(indices.length).toBeGreaterThan(0);
    indices.forEach((index, i) => {
      const box = room01.boxes[index]!;
      const size = { x: box.max.x - box.min.x, y: box.max.y - box.min.y, z: box.max.z - box.min.z };
      const geo = shelfGeometry(size.x, size.y, size.z, 7 + i * 31);
      geo.computeBoundingBox();
      const bounds = geo.boundingBox!;
      for (const axis of ["x", "y", "z"] as const) {
        expect(bounds.max[axis]).toBeLessThanOrEqual(size[axis] / 2 + EPSILON);
        expect(bounds.min[axis]).toBeGreaterThanOrEqual(-size[axis] / 2 - EPSILON);
      }
    });
  });

  test("les étagères sont adossées au mur du fond et laissent passer les ennemis qui apparaissent", () => {
    for (const index of room01.shelfBoxIndices ?? []) {
      const box = room01.boxes[index]!;
      for (const spawn of room01.spawns) {
        const inside = spawn.pos.x > box.min.x - 0.5 && spawn.pos.x < box.max.x + 0.5 && spawn.pos.z < box.max.z + 0.5 && spawn.pos.y < box.max.y;
        expect(inside).toBe(false);
      }
    }
  });
});
