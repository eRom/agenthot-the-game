// Post-traitement (spec 6.2) : contours fins à l'encre (profondeur + normales), glow limité aux
// matériaux de menace, aberration chromatique à la mort. Un seul rendu de la scène, trois sorties (MRT).
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { denoise } from "three/addons/tsl/display/DenoiseNode.js";
import { ao } from "three/addons/tsl/display/GTAONode.js";
import {
  Fn,
  abs,
  cameraFar,
  cameraNear,
  color as tslColor,
  dot,
  float,
  max,
  mix,
  mrt,
  normalView,
  normalize,
  output,
  pass,
  perspectiveDepthToViewZ,
  screenSize,
  screenUV,
  uniform,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { PALETTE } from "./palette";

export const POST = {
  // Essai de rendu du 2026-09-30 : plus de trait d'encre, les volumes se lisent par l'ombre des coins (occlusion
  // ambiante). `outline` remet les traits, pour comparer.
  outline: false,
  // Occlusion ambiante : rayon en mètres, force du mélange (1 = occlusion entière), part de la résolution.
  aoRadius: 0.9,
  // Intensité de l'occlusion elle-même (1 = physique) : poussée, c'est elle qui remplace le trait.
  aoIntensity: 1.6,
  aoStrength: 1,
  aoScale: 0.5,
  // Contour de profondeur : écart relatif du laplacien de 1/z (nul sur une surface plane).
  outlineDepth: 0.1,
  // Contour de normales : cosinus en dessous duquel deux pixels voisins forment une arête.
  outlineNormal: 0.8,
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

// Masque de glow : seuls les matériaux de menace l'écrivent. La menace ne reçoit pas de contour encre :
// son halo la détoure, et un trait fin (visée, traînée) serait noirci par le détecteur.
export const GLOW_MRT = mrt({ glow: float(1) });

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
    scenePass.setMRT(mrt({ output, normal: normalView, glow: float(0) }));
    const colorTex = scenePass.getTextureNode("output");
    const normalTex = scenePass.getTextureNode("normal");
    const depthTex = scenePass.getTextureNode("depth");
    const glowTex = scenePass.getTextureNode("glow");
    const texel = vec2(1).div(screenSize);

    // 1/z est affine à l'écran sur un plan : son laplacien ne réagit qu'aux vraies ruptures.
    const invZ = (uv: THREE.Node) =>
      float(1).div(perspectiveDepthToViewZ(depthTex.sample(uv).x, cameraNear, cameraFar));
    const edge = Fn(() => {
      const center = invZ(screenUV);
      const normal = normalTex.sample(screenUV).xyz;
      // L'anticrénelage moyenne les normales en bord d'objet : on compare des directions (normalisées),
      // et une normale presque nulle (fond, pixel à peine couvert) ne crée pas d'arête.
      const validNormal = (n: typeof normal) => dot(n, n).greaterThan(0.09);
      // Un pixel de menace n'a pas de contour et n'en crée pas chez ses voisins. Seuil bas :
      // l'anticrénelage moyenne le masque d'un trait d'un pixel avec le fond.
      const ignored = (uv: THREE.Node) => glowTex.sample(uv).x.greaterThan(0.1);
      const laplacian = float(0).toVar();
      const normalEdge = float(0).toVar();
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const uv = screenUV.add(vec2(dx, dy).mul(texel));
        // Voisin ignoré : on le remplace par le centre (écart nul).
        const skip = ignored(uv);
        laplacian.addAssign(skip.select(0, invZ(uv).sub(center)));
        const neighbor = normalTex.sample(uv).xyz;
        const trusted = skip.not().and(validNormal(normal)).and(validNormal(neighbor));
        const cos = trusted.select(dot(normalize(normal), normalize(neighbor)), 1);
        normalEdge.assign(max(normalEdge, cos.lessThan(POST.outlineNormal).select(1, 0)));
      }
      const depthEdge = abs(laplacian).div(abs(center)).greaterThan(POST.outlineDepth).select(1, 0);
      return ignored(screenUV).select(0, max(depthEdge, normalEdge));
    })();

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
    // Occlusion ambiante : elle assombrit les coins et le pied des baies. La menace n'en reçoit pas (son orange
    // reste vif).
    // Elle lit une profondeur sans anticrénelage (le GTAO refuse une profondeur multi-échantillonnée) : une passe
    // à part, sans échantillons, qui n'écrit que les normales.
    const aoPrePass = pass(scene, camera, { samples: 0 });
    aoPrePass.setMRT(mrt({ output: normalView }));
    const aoNormal = aoPrePass.getTextureNode("output");
    const aoDepth = aoPrePass.getTextureNode("depth");
    const aoPass = ao(aoDepth, aoNormal, camera);
    aoPass.resolutionScale = POST.aoScale;
    aoPass.radius.value = POST.aoRadius;
    aoPass.scale.value = POST.aoIntensity;
    // DenoiseNode est typé sans ses composantes : lecture par cast (il rend un vec4, occlusion dans le rouge).
    const occlusion = (denoise(aoPass.getTextureNode(), aoDepth, aoNormal, camera) as unknown as typeof colorTex).r;
    const shaded = toned.mul(mix(float(1), occlusion, float(POST.aoStrength).mul(float(1).sub(threatMask))));
    const inked = POST.outline ? mix(shaded, tslColor(PALETTE.ink), edge) : shaded;
    const glow = bloom(colorTex.mul(glowTex.x), POST.bloomStrength, POST.bloomRadius, POST.bloomThreshold);
    // Le halo garde toute sa force autour de la menace, mais n'est ajouté qu'en partie sur la menace elle-même :
    // ajouté en entier, ce flou uniforme remontait les facettes sombres et aplatissait le cristal (spec 6.2).
    const halo = glow.rgb.mul(mix(float(1), float(POST.bloomOnThreat), glowTex.sample(screenUV).x));

    const faded = mix(inked.add(halo), linearColor(PALETTE.void), this.fade);
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
