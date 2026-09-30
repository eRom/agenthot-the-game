// Post-traitement (spec 6.2) : occlusion ambiante (l'ombre des coins dessine les volumes), glow limité aux
// matériaux de menace, aberration chromatique à la mort. Deux rendus de la scène : l'image (couleur et masque de
// glow), et une passe de profondeur et de normales pour l'occlusion.
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { denoise } from "three/addons/tsl/display/DenoiseNode.js";
import { ao } from "three/addons/tsl/display/GTAONode.js";
import { dot, float, mix, mrt, normalView, output, pass, screenUV, uniform, vec3, vec4 } from "three/tsl";
import * as THREE from "three/webgpu";
import { PALETTE } from "./palette";

export const POST = {
  // Occlusion ambiante (rendu du 2026-09-30, validé en jeu par Romain) : elle remplace le trait d'encre. Rayon en
  // mètres, part de la résolution.
  aoRadius: 0.9,
  // Intensité de l'occlusion (1 = physique) : poussée, c'est elle qui donne le relief.
  aoIntensity: 1.6,
  aoScale: 0.5,
  // Réglé le 2026-09-29 (revue finale) : à 1,2 le halo, ajouté par-dessus le corps de l'ennemi, saturait le rouge de
  // 68 % de ses pixels et écrasait ses facettes (spec 6.2 : facettes latérales plus sombres). À 0,5 : 2 % de
  // pixels saturés, facettes lisibles, halo conservé autour de la silhouette.
  bloomStrength: 0.5,
  bloomRadius: 0.4,
  bloomThreshold: 0,
  // Part du halo ajoutée sur les pixels de menace eux-mêmes (1 = tout, comme avant la tâche 9). Réglé le
  // 2026-09-29 : à 1, une facette à 10 % de l'orange ressortait en ton moyen (mesuré, sonde teinte ±90 %) ;
  // à 0,3, le cristal se lit et le halo autour de la silhouette reste entier.
  bloomOnThreat: 0.3,
  // Décalage des canaux rouge et bleu à la mort, en fraction de l'écran au bord.
  aberration: 0.012,
  // Rampe de la menace : sa luminance choisit une teinte entre la braise (ombre), `threat` et `threat-hot`
  // (lumière). Une facette dans l'ombre reste un orange profond et vif au lieu de brunir (plan 2, report 22).
  threatShadow: 0x8f2b14,
  // Part de la luminance de `threat` sous laquelle un pixel prend la braise pure : en dessous, tout est braise.
  threatShadowStart: 0.3,
} as const;

// Masque de glow : seuls les matériaux de menace l'écrivent. La menace ne reçoit pas d'occlusion : son orange
// reste vif, et son halo la détoure.
export const GLOW_MRT = mrt({ glow: float(1) });

// Calque des objets qui ne font pas d'ombre de coin : arme et mains du joueur (collées à la caméra, elles
// assombrissaient la baie ou le mur contre lequel on s'abrite), balles, traînées, traits de visée, éclats, armes
// du monde. La caméra du jeu voit ce calque ; la passe de l'occlusion ne voit que le calque 0.
export const NO_OCCLUSION_LAYER = 1;

const LUMA = vec3(0.2126, 0.7152, 0.0722);

function linearColor(hex: number) {
  const c = new THREE.Color(hex);
  return vec3(c.r, c.g, c.b);
}

function lumaOf(hex: number): number {
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

export class PostPipeline {
  private readonly pipeline: THREE.RenderPipeline;
  // 0 en jeu, 1 à la mort.
  private readonly death = uniform(0);
  // Fondu au vide (0 = image nette, 1 = tout `void`) : bouclage du fond du menu.
  private readonly fade = uniform(0);

  constructor(renderer: THREE.WebGPURenderer, scene: THREE.Scene, camera: THREE.Camera) {
    const scenePass = pass(scene, camera);
    scenePass.setMRT(mrt({ output, glow: float(0) }));
    const colorTex = scenePass.getTextureNode("output");
    const glowTex = scenePass.getTextureNode("glow");

    // Aberration : rouge et bleu glissent vers les bords, seulement à la mort.
    const shift = screenUV.sub(0.5).mul(this.death.mul(POST.aberration));
    const color = vec3(
      colorTex.sample(screenUV.add(shift)).r,
      colorTex.sample(screenUV).g,
      colorTex.sample(screenUV.sub(shift)).b,
    );
    // Rampe de la menace : même luminance, teinte toujours saturée. La luminance du pixel choisit sa place
    // entre la braise, `threat` et `threat-hot` (espace linéaire : THREE.Color convertit depuis sRGB).
    const luma = dot(color, LUMA);
    const shadow = linearColor(POST.threatShadow);
    const mid = linearColor(PALETTE.threat);
    const hot = linearColor(PALETTE.threatHot);
    const midLuma = lumaOf(PALETTE.threat);
    const hotLuma = lumaOf(PALETTE.threatHot);
    // Sous la luminance de `threat` : de la braise à `threat`. La facette la plus sombre reste braise, jamais brune.
    const low = mix(shadow, mid, luma.sub(midLuma * POST.threatShadowStart).div(midLuma * (1 - POST.threatShadowStart)).clamp());
    const high = mix(mid, hot, luma.sub(midLuma).div(hotLuma - midLuma).clamp());
    const threatMask = glowTex.sample(screenUV).x;
    const toned = mix(color, luma.lessThan(midLuma).select(low, high), threatMask);
    // Occlusion ambiante : elle assombrit les coins et le pied des baies. Elle lit une profondeur sans
    // anticrénelage (le GTAO de r186 refuse une profondeur multi-échantillonnée en WebGPU, issue three.js 34598) :
    // une passe à part, sans échantillons, qui n'écrit que les normales, et ne dessine que le décor et les ennemis.
    const occluders = new THREE.Layers();
    occluders.set(0);
    const aoPrePass = pass(scene, camera, { samples: 0 });
    aoPrePass.setLayers(occluders);
    aoPrePass.setMRT(mrt({ output: normalView }));
    const aoNormal = aoPrePass.getTextureNode("output");
    const aoDepth = aoPrePass.getTextureNode("depth");
    const aoPass = ao(aoDepth, aoNormal, camera);
    aoPass.resolutionScale = POST.aoScale;
    aoPass.radius.value = POST.aoRadius;
    aoPass.scale.value = POST.aoIntensity;
    // DenoiseNode rend un vec4 (occlusion dans le rouge), mais @types/three le type sans ses composantes : cast.
    const occlusion = (denoise(aoPass.getTextureNode(), aoDepth, aoNormal, camera) as unknown as typeof colorTex).r;
    const shaded = toned.mul(mix(occlusion, float(1), threatMask));
    const glow = bloom(colorTex.mul(glowTex.x), POST.bloomStrength, POST.bloomRadius, POST.bloomThreshold);
    // Le halo garde toute sa force autour de la menace, mais n'est ajouté qu'en partie sur la menace elle-même :
    // ajouté en entier, ce flou uniforme remontait les facettes sombres et aplatissait le cristal (spec 6.2).
    const halo = glow.rgb.mul(mix(float(1), float(POST.bloomOnThreat), glowTex.sample(screenUV).x));

    const faded = mix(shaded.add(halo), linearColor(PALETTE.void), this.fade);
    this.pipeline = new THREE.RenderPipeline(renderer, vec4(faded, 1));
  }

  setDeath(amount: number): void {
    this.death.value = amount;
  }

  setFade(amount: number): void {
    this.fade.value = amount;
  }

  render(): void {
    this.pipeline.render();
  }
}
