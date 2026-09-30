// Crée le renderer : WebGPU si possible, sinon WebGL2 (repli automatique de Three.js r186).
import * as THREE from "three/webgpu";
import { browserRenderingEnvironment, hasRendering } from "./rendering-support";

export interface RendererHandle {
  renderer: THREE.WebGPURenderer;
  isWebGPU: boolean;
}

export async function createRenderer(container: HTMLElement, forceWebGL: boolean): Promise<RendererHandle> {
  // Sans WebGPU ni WebGL2, l'initialisation de Three.js ne rend jamais la main (mesuré le 2026-09-29 : bloquée plus
  // de 20 s) : on le vérifie avant, pour que le chargeur affiche un message au lieu d'attendre sans fin.
  if (!(await hasRendering(browserRenderingEnvironment(), forceWebGL))) throw new Error("neither WebGPU nor WebGL2 is available");
  const renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL });
  renderer.setPixelRatio(basePixelRatio(true));
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Ombres douces : PCF filtré (PCFSoftShadowMap n'existe plus en r186, il retombe sur PCF).
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);
  await renderer.init();
  // `isWebGPUBackend` n'est typé que sur WebGPUBackend : lecture par cast (brief r186).
  const isWebGPU = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend === true;
  if (!isWebGPU) renderer.setPixelRatio(basePixelRatio(false));
  return { renderer, isWebGPU };
}

// Résolution de base, avant la qualité auto (quality.ts). Le repli WebGL2 tombait sous 60 images par seconde en
// Retina (pixel ratio 2, soit 4 fois les pixels du pixel ratio 1, avec le post-traitement en plusieurs passes) :
// on plafonne à 1,5 hors WebGPU (spec 9.2).
export function basePixelRatio(isWebGPU: boolean): number {
  return Math.min(window.devicePixelRatio, isWebGPU ? 2 : 1.5);
}
