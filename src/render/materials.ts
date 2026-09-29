// Matériaux du jeu (spec 6.2). L'orange ne va qu'à la menace, et elle seule porte le masque de glow.
import { color, dot, float, max, normalView, positionViewDirection } from "three/tsl";
import * as THREE from "three/webgpu";
import { PALETTE } from "./palette";
import { GLOW_MRT } from "./post";

// Décor : blanc cassé. Ce sont des boîtes, leurs normales sont déjà plates : pas de flatShading,
// dont les normales par dérivées laissent des points parasites dans le détecteur de contours.
export function worldMaterial(tone: number): THREE.MeshStandardNodeMaterial {
  return new THREE.MeshStandardNodeMaterial({ color: tone, roughness: 0.9 });
}

// Ennemis et éclats de menace : orange émissif léger ; les facettes de côté, moins éclairées, sont plus sombres.
export function threatMaterial(): THREE.MeshStandardNodeMaterial {
  const mat = new THREE.MeshStandardNodeMaterial({
    color: PALETTE.threat,
    emissive: PALETTE.threat,
    emissiveIntensity: 0.3,
    roughness: 0.45,
    flatShading: true,
  });
  mat.mrtNode = GLOW_MRT;
  return mat;
}

// Armes et mains : noir mat, avec un liseré clair (fresnel) pour se lire devant le vide sombre.
export function inkMaterial(): THREE.MeshStandardNodeMaterial {
  const mat = new THREE.MeshStandardNodeMaterial({ color: PALETTE.ink, roughness: 0.6, flatShading: true });
  const facing = max(dot(normalView, positionViewDirection), float(0));
  mat.emissiveNode = color(PALETTE.world).mul(float(1).sub(facing).pow(3)).mul(0.7);
  return mat;
}

// Balles, traînées et traits de visée : couleur pure, glow. Opaques : une transparence diluerait
// aussi le masque de glow.
export function threatBasicMaterial(tone: number): THREE.MeshBasicNodeMaterial {
  const mat = new THREE.MeshBasicNodeMaterial({ color: tone });
  mat.mrtNode = GLOW_MRT;
  return mat;
}

// Traits de visée : couleur par sommet (de threat à threat-hot avec la progression de la visée).
export function aimLineMaterial(): THREE.LineBasicNodeMaterial {
  const mat = new THREE.LineBasicNodeMaterial({ vertexColors: true });
  mat.mrtNode = GLOW_MRT;
  return mat;
}
