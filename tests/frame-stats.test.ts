import { describe, expect, test } from "bun:test";
import { FRAME_STATS, FrameStats, percentile } from "../src/app/frame-stats";

// `count` images de `ms` millisecondes et `draws` appels de dessin.
function feed(stats: FrameStats, count: number, ms: number, draws = 40): void {
  for (let i = 0; i < count; i++) stats.push(ms, draws);
}

describe("sonde d'images (spec AC-8)", () => {
  test("centile par rang le plus proche ; une liste vide donne 0", () => {
    expect(percentile([], 0.95)).toBe(0);
    expect(percentile([10], 0.95)).toBe(10);
    // 20 valeurs : le 95e centile est la 19e.
    expect(percentile(Array.from({ length: 20 }, (_, i) => i + 1), 0.95)).toBe(19);
  });

  test("sans image, le rapport est à zéro", () => {
    expect(new FrameStats().report()).toEqual({ frames: 0, p95Ms: 0, worstWindowP95Ms: 0, maxMs: 0, maxDrawCalls: 0 });
  });

  test("une partie fluide avec un passage lent : le pire moment ressort, la moyenne de la partie le cache", () => {
    const stats = new FrameStats();
    feed(stats, 1000, 16);
    // Une demi-seconde à 30 images par seconde, avec plus d'appels de dessin (l'éclatement).
    feed(stats, 15, 33, 58);
    feed(stats, 1000, 16);
    const report = stats.report();
    expect(report.frames).toBe(2015);
    // 15 images lentes sur 2 015 : moins de 5 %, le centile global ne les voit pas.
    expect(report.p95Ms).toBe(16);
    // Dans la fenêtre de 2 s qui les contient, elles pèsent plus de 5 %.
    expect(report.worstWindowP95Ms).toBe(33);
    expect(report.maxMs).toBe(33);
    expect(report.maxDrawCalls).toBe(58);
  });

  test("une image isolée en retard (changement d'onglet) ne fait pas le pire moment", () => {
    const stats = new FrameStats();
    feed(stats, 300, 16);
    stats.push(400, 40);
    feed(stats, 300, 16);
    const report = stats.report();
    expect(report.maxMs).toBe(400);
    expect(report.worstWindowP95Ms).toBe(16);
  });

  test("l'anneau plein oublie les plus vieilles images, et reset le vide", () => {
    const stats = new FrameStats();
    feed(stats, 50, 99, 70);
    feed(stats, FRAME_STATS.capacity, 16);
    const report = stats.report();
    expect(report.frames).toBe(FRAME_STATS.capacity);
    expect(report.maxMs).toBe(16);
    expect(report.maxDrawCalls).toBe(40);
    stats.reset();
    expect(stats.report().frames).toBe(0);
  });

  test("les durées sortent au dixième de milliseconde", () => {
    const stats = new FrameStats();
    feed(stats, 10, 17.6);
    expect(stats.report().p95Ms).toBe(17.6);
    expect(stats.report().maxMs).toBe(17.6);
  });

  test("moins d'images qu'une fenêtre : le pire moment est tout ce qu'on a", () => {
    const stats = new FrameStats();
    feed(stats, 10, 20);
    expect(stats.report().worstWindowP95Ms).toBe(20);
  });
});
