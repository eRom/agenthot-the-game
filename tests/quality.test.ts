import { describe, expect, test } from "bun:test";
import { FrameLimiter, QUALITY, QualityGovernor } from "../src/render/quality";

// Durée d'échauffement du gouverneur (s) : marge de 0,1 s pour passer la limite sans dépendre des arrondis.
const WARM_UP = QUALITY.warmUp + 0.1;

// Fait passer `seconds` secondes d'images de `frameMs` au gouverneur ; renvoie les échelles prises en route.
function feed(governor: QualityGovernor, frameMs: number, seconds: number): number[] {
  const scales: number[] = [];
  for (let t = 0; t < seconds * 1000; t += frameMs) if (governor.sample(frameMs)) scales.push(governor.scale);
  return scales;
}

describe("qualité automatique (spec 9.2, plan 3 report 25)", () => {
  test("images lentes (25 ms) pendant 2 s : la résolution baisse d'un palier ; encore 2 s : un palier de plus, puis plus bas rien", () => {
    const g = new QualityGovernor("auto");
    expect(g.scale).toBe(1);
    feed(g, 25, WARM_UP);
    expect(feed(g, 25, 2.1)).toEqual([0.85]);
    expect(feed(g, 25, 2.1)).toEqual([0.7]);
    expect(feed(g, 25, 10)).toEqual([]);
    expect(g.scale).toBe(0.7);
  });

  test("après 10 s stables (16,7 ms), la résolution remonte d'un palier, puis d'un autre 10 s plus tard", () => {
    const g = new QualityGovernor("auto");
    feed(g, 25, WARM_UP);
    feed(g, 25, 4.2);
    expect(feed(g, 16.7, 9)).toEqual([]);
    expect(feed(g, 16.7, 1.5)).toEqual([0.85]);
    expect(feed(g, 16.7, 10.5)).toEqual([1]);
  });

  test("un à-coup isolé ne compte pas : c'est la moyenne sur 2 s qui décide", () => {
    const g = new QualityGovernor("auto");
    feed(g, 16.7, WARM_UP);
    for (let i = 0; i < 3; i++) {
      g.sample(100);
      feed(g, 16.7, 1.9);
    }
    expect(g.scale).toBe(1);
  });

  test("haute : pleine résolution, jamais réduite, sans limite d'images ; basse : dernier palier, 60 images/s", () => {
    const high = new QualityGovernor("high");
    expect(feed(high, 40, 10)).toEqual([]);
    expect(high.scale).toBe(1);
    expect(high.fpsCap).toBe(0);
    const low = new QualityGovernor("low");
    expect(low.scale).toBe(QUALITY.steps[QUALITY.steps.length - 1]!);
    expect(low.fpsCap).toBe(60);
    expect(new QualityGovernor("auto").fpsCap).toBe(60);
  });

  test("retour d'un onglet caché : l'arrêt de plusieurs secondes n'est pas pris pour une image lente", () => {
    const g = new QualityGovernor("auto");
    feed(g, 16.7, WARM_UP);
    feed(g, 16.7, 1);
    g.sample(8000);
    feed(g, 16.7, 1.2);
    expect(g.scale).toBe(1);
  });

  test("un arrêt remet la fenêtre de mesure à zéro : les images lentes d'avant et d'après ne s'additionnent pas", () => {
    const g = new QualityGovernor("auto");
    feed(g, 16.7, WARM_UP);
    // 1,5 s d'images lentes, un arrêt, puis 1 s d'images lentes : chaque moitié est trop courte pour décider seule.
    expect(feed(g, 25, 1.5)).toEqual([]);
    g.sample(8000);
    expect(feed(g, 25, 1)).toEqual([]);
    expect(g.scale).toBe(1);
  });

  test("changer de mode repart de son palier de départ", () => {
    const g = new QualityGovernor("auto");
    feed(g, 25, WARM_UP);
    expect(feed(g, 25, 2.1)).toEqual([0.85]);
    g.setMode("high");
    expect(g.scale).toBe(1);
    g.setMode("low");
    expect(g.scale).toBe(0.7);
    g.setMode("auto");
    expect(g.scale).toBe(1);
  });

  test("échauffement : un accroc de 240 ms au démarrage (compilation des shaders) ne fait pas baisser la résolution", () => {
    const g = new QualityGovernor("auto");
    feed(g, 16.7, 0.5);
    g.sample(240);
    expect(feed(g, 16.7, 15)).toEqual([]);
    expect(g.scale).toBe(1);
  });

  test("l'échauffement est borné dans le temps : le même accroc après 3 s fait bien baisser la résolution", () => {
    const g = new QualityGovernor("auto");
    feed(g, 16.7, WARM_UP);
    g.sample(240);
    expect(feed(g, 16.7, 3)).toEqual([0.85]);
  });

  test("après un changement de mode, l'échauffement de 3 s s'applique de nouveau", () => {
    const g = new QualityGovernor("auto");
    feed(g, 25, WARM_UP);
    feed(g, 25, 2.1);
    g.setMode("auto");
    feed(g, 16.7, 0.5);
    g.sample(240);
    expect(feed(g, 16.7, 15)).toEqual([]);
    expect(g.scale).toBe(1);
  });

  test("après l'échauffement, une charge soutenue de 20 ms par image fait baisser la résolution dans la fenêtre de 2 s", () => {
    const g = new QualityGovernor("auto");
    feed(g, 16.7, WARM_UP);
    expect(feed(g, 20, 2.1)).toEqual([0.85]);
  });
});

describe("limite d'images par seconde", () => {
  // Nombre d'images rendues en une seconde sur un écran à `hz`, avec la limite `cap`.
  function rendered(hz: number, cap: number): number {
    const limiter = new FrameLimiter();
    let n = 0;
    for (let i = 0; i < hz * 10; i++) if (limiter.shouldRender(1000 + (i * 1000) / hz, cap)) n++;
    return n / 10;
  }

  test("60 images/s sur un écran à 60, 120 ou 144 Hz", () => {
    expect(rendered(60, 60)).toBeCloseTo(60, 0);
    expect(Math.abs(rendered(120, 60) - 60)).toBeLessThanOrEqual(1);
    expect(Math.abs(rendered(144, 60) - 60)).toBeLessThanOrEqual(1);
  });

  test("sans limite, chaque image de l'écran est rendue", () => {
    expect(rendered(120, 0)).toBe(120);
  });

  test("après une longue pause (onglet caché), pas de rafale de rattrapage", () => {
    const limiter = new FrameLimiter();
    expect(limiter.shouldRender(0, 60)).toBe(true);
    expect(limiter.shouldRender(5000, 60)).toBe(true);
    expect(limiter.shouldRender(5008, 60)).toBe(false);
  });
});
