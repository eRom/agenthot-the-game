import { describe, expect, test } from "bun:test";
import { PLAYER } from "../src/sim/entities";
import {
  FIST,
  GRIP_HAND,
  PISTOL,
  VIEW_MODEL,
  type ViewModelOffset,
  jabOffset,
  kickOffset,
  shapeBounds,
} from "../src/render/weapon-shapes";

// Point dans un polygone (règle pair-impair).
function inside(poly: readonly (readonly [number, number])[], u: number, v: number): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ui, vi] = poly[i]!;
    const [uj, vj] = poly[j]!;
    if (vi > v !== vj > v && u < ((uj - ui) * (v - vi)) / (vj - vi) + ui) hit = !hit;
  }
  return hit;
}

describe("pistolet et mains en code (plan 3, report 24)", () => {
  test("le pistolet pointe vers l'avant : la bouche du canon est son point le plus en avant, à hauteur de la culasse", () => {
    const front = Math.max(...PISTOL.outline.map(([u]) => u));
    const muzzle = PISTOL.outline.filter(([u]) => u === front);
    expect(muzzle.length).toBeGreaterThan(1);
    // La bouche est en haut du profil, pas au bout de la crosse.
    for (const [, v] of muzzle) expect(v).toBeGreaterThan(0.05);
  });

  test("l'origine est dans la crosse, hors du pontet : posée dans une main (ennemi, joueur), l'arme y est tenue par la crosse", () => {
    expect(inside(PISTOL.outline, 0, 0)).toBe(true);
    expect(inside(PISTOL.guardHole, 0, 0)).toBe(false);
    // Le pontet est bien percé dans le profil.
    for (const [u, v] of PISTOL.guardHole) expect(inside(PISTOL.outline, u, v)).toBe(true);
  });

  test("la main serre la crosse sans jamais passer devant la bouche du canon", () => {
    const muzzleZ = -Math.max(...PISTOL.outline.map(([u]) => u));
    const hand = shapeBounds(GRIP_HAND);
    expect(hand.min[2]).toBeGreaterThan(muzzleZ);
    // Elle enveloppe l'origine (la crosse) et l'avant-bras part vers l'arrière et vers le bas (bas de l'écran).
    for (let k = 0; k < 3; k++) {
      expect(hand.min[k]).toBeLessThan(0);
      expect(hand.max[k]).toBeGreaterThan(0);
    }
    expect(hand.max[2]).toBeGreaterThan(0.2);
    expect(hand.min[1]).toBeLessThan(-0.15);
  });

  test("le poing a ses doigts devant (vers −Z) et son avant-bras derrière", () => {
    const fist = shapeBounds(FIST);
    expect(fist.min[2]).toBeLessThan(-0.03);
    expect(fist.max[2]).toBeGreaterThan(0.2);
  });
});

describe("gestes de l'arme en main (plan 3, report 24)", () => {
  const full = PLAYER.fireCooldown;
  const out: ViewModelOffset = { back: 0, lift: 0 };

  test("au tir, l'arme recule et se relève d'un coup, puis revient en 0,15 s de simulation", () => {
    kickOffset(full, full, out);
    expect(out.back).toBeCloseTo(VIEW_MODEL.kickBack, 9);
    expect(out.lift).toBeCloseTo(VIEW_MODEL.kickLift, 9);
    let previous = out.back;
    for (let t = 0.01; t < VIEW_MODEL.kickTime; t += 0.01) {
      kickOffset(full - t, full, out);
      expect(out.back).toBeLessThan(previous);
      previous = out.back;
    }
    kickOffset(full - VIEW_MODEL.kickTime, full, out);
    expect(out.back).toBeCloseTo(0, 9);
    expect(out.lift).toBeCloseTo(0, 9);
  });

  test("sans tir en cours (recharge finie, ou pas encore tiré), l'arme reste au repos", () => {
    kickOffset(0, full, out);
    expect(out.back).toBe(0);
    expect(out.lift).toBe(0);
  });

  test("le coup de poing part vite, atteint sa portée au tiers du geste, et revient à zéro", () => {
    expect(jabOffset(0)).toBe(0);
    expect(jabOffset(VIEW_MODEL.jabTime / 3)).toBeCloseTo(VIEW_MODEL.jabReach, 9);
    expect(jabOffset(VIEW_MODEL.jabTime)).toBe(0);
    expect(jabOffset(Number.POSITIVE_INFINITY)).toBe(0);
    // Aller plus rapide que le retour.
    expect(jabOffset(VIEW_MODEL.jabTime / 6)).toBeGreaterThan(jabOffset((VIEW_MODEL.jabTime * 5) / 6));
  });
});
