// Le navigateur sait-il dessiner ? Séparé de create-renderer.ts (qui charge Three.js) pour rester testable.

// Ce que la vérification lit du navigateur : l'API WebGPU (si elle existe) et un test WebGL2.
export interface RenderingEnvironment {
  gpu?: { requestAdapter(): Promise<unknown> } | null;
  hasWebGL2(): boolean;
}

// WebGPU (sauf repli forcé) ou, à défaut, WebGL2. `navigator.gpu` seul ne prouve rien : sans adaptateur, Three.js
// ne rend jamais la main (mesuré le 2026-09-29, plus de 20 s), donc on demande l'adaptateur. Un refus ou une
// exception comptent comme l'absence de WebGPU.
export async function hasRendering(env: RenderingEnvironment, forceWebGL: boolean): Promise<boolean> {
  if (!forceWebGL && env.gpu) {
    try {
      if ((await env.gpu.requestAdapter()) !== null) return true;
    } catch {
      // Traité comme « pas de WebGPU » : on tente WebGL2.
    }
  }
  return env.hasWebGL2();
}

export function browserRenderingEnvironment(): RenderingEnvironment {
  return {
    gpu: "gpu" in navigator ? (navigator.gpu as RenderingEnvironment["gpu"]) : null,
    hasWebGL2: () => document.createElement("canvas").getContext("webgl2") !== null,
  };
}
