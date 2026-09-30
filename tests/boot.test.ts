import { describe, expect, test } from "bun:test";
import { TimeoutError, withTimeout } from "../src/app/boot-failure";
import { hasRendering } from "../src/render/rendering-support";
import { isPlainKeypress } from "../src/ui/dom";

describe("détection du rendu (chargeur, AC-10)", () => {
  test("WebGPU annoncé mais aucun adaptateur, et pas de WebGL2 : aucun rendu possible", async () => {
    const env = { gpu: { requestAdapter: async () => null }, hasWebGL2: () => false };
    expect(await hasRendering(env, false)).toBe(false);
  });

  test("WebGPU annoncé mais aucun adaptateur, WebGL2 présent : le rendu est possible (repli)", async () => {
    const env = { gpu: { requestAdapter: async () => null }, hasWebGL2: () => true };
    expect(await hasRendering(env, false)).toBe(true);
  });

  test("un adaptateur suffit, sans même tester WebGL2", async () => {
    const env = {
      gpu: { requestAdapter: async () => ({}) },
      hasWebGL2: () => {
        throw new Error("WebGL2 ne devait pas être testé");
      },
    };
    expect(await hasRendering(env, false)).toBe(true);
  });

  test("une demande d'adaptateur qui échoue compte comme l'absence de WebGPU", async () => {
    const env = {
      gpu: {
        requestAdapter: async () => {
          throw new Error("refusé");
        },
      },
      hasWebGL2: () => false,
    };
    expect(await hasRendering(env, false)).toBe(false);
  });

  test("repli WebGL forcé : WebGPU n'est pas interrogé", async () => {
    const env = {
      gpu: {
        requestAdapter: async () => {
          throw new Error("WebGPU ne devait pas être interrogé");
        },
      },
      hasWebGL2: () => true,
    };
    expect(await hasRendering(env, true)).toBe(true);
  });

  test("pas de WebGPU du tout : seul WebGL2 compte", async () => {
    expect(await hasRendering({ hasWebGL2: () => true }, false)).toBe(true);
    expect(await hasRendering({ hasWebGL2: () => false }, false)).toBe(false);
  });
});

describe("délai maximal du moteur (chargeur)", () => {
  test("une promesse qui se résout à temps garde sa valeur", async () => {
    expect(await withTimeout(Promise.resolve(42), 50)).toBe(42);
  });

  test("une promesse qui ne se règle jamais est rejetée par une TimeoutError", async () => {
    const never = new Promise<never>(() => undefined);
    await expect(withTimeout(never, 20)).rejects.toBeInstanceOf(TimeoutError);
  });

  test("le rejet d'origine passe tel quel, sans être pris pour un dépassement", async () => {
    const boom = new Error("boom");
    await expect(withTimeout(Promise.reject(boom), 50)).rejects.toBe(boom);
  });
});

describe("gestes acceptés par le chargeur et la cinématique", () => {
  const key = (init: Partial<Parameters<typeof isPlainKeypress>[0]>) =>
    isPlainKeypress({ key: "Enter", metaKey: false, ctrlKey: false, altKey: false, repeat: false, ...init });

  test("une touche simple compte", () => {
    expect(key({})).toBe(true);
    expect(key({ key: " " })).toBe(true);
  });

  test("Cmd+R, Cmd+Maj+4, Ctrl+touche et Alt+touche ne comptent pas", () => {
    expect(key({ key: "r", metaKey: true })).toBe(false);
    expect(key({ key: "4", metaKey: true })).toBe(false);
    expect(key({ key: "c", ctrlKey: true })).toBe(false);
    expect(key({ key: "Tab", altKey: true })).toBe(false);
  });

  test("les touches de modification seules ne comptent pas", () => {
    for (const modifier of ["Shift", "Control", "Alt", "Meta"]) expect(key({ key: modifier })).toBe(false);
  });

  test("la répétition d'une touche tenue ne compte pas", () => {
    expect(key({ repeat: true })).toBe(false);
  });
});
