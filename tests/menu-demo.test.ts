import { describe, expect, test } from "bun:test";
import { MENU_CAMERA, MENU_DEMO, type MenuCameraPose, menuCamera, menuFade, recordMenuDemo } from "../src/replay/menu-demo";
import { ReplayPlayer } from "../src/replay/player";
import { EVENT_STRIDE, LAYOUT, RECORDED_EVENTS } from "../src/replay/recorder";
import { room01 } from "../src/rooms/room-01-datacenter";

// Types des événements enregistrés dans la démo, dans l'ordre.
function eventTypes(recorder: ReturnType<typeof recordMenuDemo>): string[] {
  const types: string[] = [];
  for (let i = 0; i < recorder.eventCount; i++) types.push(RECORDED_EVENTS[recorder.events[i * EVENT_STRIDE + 1]!]!);
  return types;
}

describe("fond du menu : la démo (spec 4.3)", () => {
  const demo = recordMenuDemo(room01);

  test("la fenêtre dure de 1,15 à 2,04 s de simulation, soit une trentaine de secondes à 3 %", () => {
    const player = new ReplayPlayer(demo, room01);
    expect(player.duration).toBeGreaterThan(0.85);
    expect(player.duration).toBeLessThan(0.92);
    expect(player.duration / MENU_DEMO.playbackRate).toBeGreaterThan(28);
  });

  test("elle montre l'action : un ennemi éclate, deux baies explosent, les ennemis tirent, et le joueur est vivant", () => {
    const types = eventTypes(demo);
    expect(types.filter((t) => t === "enemyKilled").length).toBe(1);
    expect(types.filter((t) => t === "rackBurst").length).toBe(2);
    expect(types.filter((t) => t === "shot").length).toBeGreaterThanOrEqual(2);
    expect(types).not.toContain("playerKilled");
  });

  test("à la fin de la fenêtre, au moins deux balles sont en vol (les balles suspendues du menu)", () => {
    const player = new ReplayPlayer(demo, room01);
    player.update(player.duration);
    expect(player.view.bullets.filter((b) => b.active).length).toBeGreaterThanOrEqual(2);
  });

  test("la démo est la même à chaque visite (simulation déterministe à entrées égales)", () => {
    const again = recordMenuDemo(room01);
    expect(again.count).toBe(demo.count);
    expect(again.eventCount).toBe(demo.eventCount);
    const size = demo.count * LAYOUT.stride;
    expect(Array.from(again.samples.subarray(0, size))).toEqual(Array.from(demo.samples.subarray(0, size)));
  });
});

describe("fond du menu : la boucle", () => {
  test("la démo part du vide et y retourne en 1,2 s réelles : la reprise de la boucle ne se voit pas", () => {
    const d = 0.89;
    const oneRealSecond = MENU_DEMO.playbackRate;
    expect(menuFade(0, d)).toBe(1);
    expect(menuFade(d, d)).toBe(1);
    expect(menuFade(d / 2, d)).toBe(0);
    expect(menuFade(oneRealSecond * 0.6, d)).toBeCloseTo(0.5, 6);
    expect(menuFade(d - oneRealSecond * 1.2, d)).toBeCloseTo(0, 6);
  });
});

describe("fond du menu : la caméra qui dérive", () => {
  test("elle reste dans la salle, au-dessus des baies, et regarde toujours vers le fond (−Z)", () => {
    const pose: MenuCameraPose = { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0 };
    for (let t = 0; t < MENU_CAMERA.period; t += 0.5) {
      menuCamera(t, pose);
      expect(Math.abs(pose.pos.x)).toBeLessThan(11.5);
      expect(Math.abs(pose.pos.z)).toBeLessThan(7.5);
      expect(pose.pos.y).toBeGreaterThan(2.2);
      expect(pose.pos.y).toBeLessThan(5.5);
      // Avant = (−sin lacet, −cos lacet) : composante z négative.
      expect(-Math.cos(pose.yaw)).toBeLessThan(0);
    }
  });

  test("elle boucle sans à-coup : même pose au début et à la fin d'une période", () => {
    const a = menuCamera(0, { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0 });
    const b = menuCamera(MENU_CAMERA.period, { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0 });
    expect(b.pos.x).toBeCloseTo(a.pos.x, 9);
    expect(b.pos.y).toBeCloseTo(a.pos.y, 9);
    expect(b.yaw).toBeCloseTo(a.yaw, 9);
  });
});
