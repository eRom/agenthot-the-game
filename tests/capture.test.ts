import { describe, expect, test } from "bun:test";
import { CAPTURE, captureDisplaySize, captureFileName, captureMimeType, captureTarget } from "../src/app/capture";

describe("enregistrement des séquences de la cinématique (plan 3b)", () => {
  test("?record=1 filme le replay, ?record=menu le fond du menu, sans paramètre rien", () => {
    expect(captureTarget(new URLSearchParams("record=1"))).toBe("replay");
    expect(captureTarget(new URLSearchParams("debug&record=replay"))).toBe("replay");
    expect(captureTarget(new URLSearchParams("record=menu"))).toBe("menu");
    expect(captureTarget(new URLSearchParams("debug"))).toBeNull();
  });

  test("le fichier porte la cible et l'heure : deux prises ne s'écrasent pas", () => {
    const vp9 = "video/webm;codecs=vp9,opus";
    expect(captureFileName("replay", new Date(2026, 8, 30, 9, 5, 7), vp9)).toBe("agenthot-replay-20260930-090507.webm");
    expect(captureFileName("menu", new Date(2026, 8, 30, 9, 5, 8), vp9)).toBe("agenthot-menu-20260930-090508.webm");
  });

  test("l'extension suit le conteneur enregistré : un MP4 (Safari) n'est pas nommé .webm", () => {
    expect(captureFileName("replay", new Date(2026, 8, 30, 9, 5, 7), "video/mp4;codecs=avc1,mp4a")).toBe("agenthot-replay-20260930-090507.mp4");
  });

  test("VP9 + Opus d'abord, VP8 en repli, WebM nu ensuite, sinon le choix du navigateur", () => {
    expect(captureMimeType(() => true)).toBe("video/webm;codecs=vp9,opus");
    expect(captureMimeType((t) => !t.includes("vp9"))).toBe("video/webm;codecs=vp8,opus");
    expect(captureMimeType((t) => t === "video/webm")).toBe("video/webm");
    expect(captureMimeType(() => false)).toBe("");
  });

  test("pendant l'enregistrement, l'image 16:9 tient dans la fenêtre sans être déformée", () => {
    // Fenêtre 16:10 (MacBook) : bandes en bas ; fenêtre très large : bandes sur le côté.
    expect(captureDisplaySize(1728, 1080)).toEqual({ width: 1728, height: 972 });
    expect(captureDisplaySize(2560, 1080)).toEqual({ width: 1920, height: 1080 });
    const { width, height } = captureDisplaySize(1512, 945);
    expect(width).toBeLessThanOrEqual(1512);
    expect(height).toBeLessThanOrEqual(945);
    expect(width / height).toBeCloseTo(CAPTURE.width / CAPTURE.height, 2);
  });
});
