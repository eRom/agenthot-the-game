// Crée le renderer : WebGPU si possible, sinon WebGL2 (repli automatique de Three.js r186).
import * as THREE from "three/webgpu";

export interface RendererHandle {
  renderer: THREE.WebGPURenderer;
  isWebGPU: boolean;
}

export async function createRenderer(container: HTMLElement, forceWebGL: boolean): Promise<RendererHandle> {
  const renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Ombres douces : PCF filtré (PCFSoftShadowMap n'existe plus en r186, il retombe sur PCF).
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);
  await renderer.init();
  // `isWebGPUBackend` n'est typé que sur WebGPUBackend : lecture par cast (brief r186).
  const isWebGPU = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend === true;
  // Le repli WebGL2 tombait sous 60 images par seconde en Retina (pixel ratio 2, soit 4 fois les pixels du
  // pixel ratio 1, avec le post-traitement en plusieurs passes) : on plafonne à 1,5 hors WebGPU (spec 9.2).
  if (!isWebGPU) renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  return { renderer, isWebGPU };
}
