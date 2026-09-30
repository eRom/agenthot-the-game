// Matériaux du jeu (spec 6.2). L'orange ne va qu'à la menace, et elle seule porte le masque de glow.
import { color, dot, float, max, mix, normalView, normalWorld, positionViewDirection } from "three/tsl";
import * as THREE from "three/webgpu";
import { PALETTE } from "./palette";
import { GLOW_MRT } from "./post";

// Part de la lumière d'ambiance reçue par la menace, facette par facette (rendu du 2026-09-30). La salle blanche
// baigne dans une ambiance forte, claire aussi par en dessous, qui aplatirait le cristal. La menace n'en reçoit
// qu'une part, grande par le haut et petite par le bas : les facettes tournées vers le sol restent sombres.
export const THREAT_AMBIENT = { down: 0.16, up: 0.85 } as const;

function threatAmbient() {
  return mix(float(THREAT_AMBIENT.down), float(THREAT_AMBIENT.up), normalWorld.y.mul(0.5).add(0.5));
}

// Décor : blanc cassé. Ce sont des boîtes, leurs normales sont déjà plates : pas de flatShading,
// dont les normales par dérivées laissent des points parasites dans le détecteur de contours.
export function worldMaterial(tone: number): THREE.MeshStandardNodeMaterial {
  return new THREE.MeshStandardNodeMaterial({ color: tone, roughness: 0.9 });
}

// Éclats de menace (les corps des ennemis ont enemyBodyMaterial) : orange émissif léger ; les facettes de côté, moins éclairées, sont plus sombres.
export function threatMaterial(): THREE.MeshStandardNodeMaterial {
  const mat = new THREE.MeshStandardNodeMaterial({
    color: PALETTE.threat,
    emissive: PALETTE.threat,
    emissiveIntensity: 0.3,
    roughness: 0.45,
    flatShading: true,
  });
  mat.aoNode = threatAmbient();
  mat.mrtNode = GLOW_MRT;
  return mat;
}

// Corps des ennemis : même orange, mais chaque facette porte sa teinte (couleur de sommet, enemy-geometry.ts),
// et l'émissif est bas (0,3 avant la tâche 9) pour que la lumière dessine le cristal : faces tournées vers
// l'ombre nettement plus sombres (spec 6.2). Réglé le 2026-09-29 après l'essai de Romain (« encore trop mannequin »).
// Les éclats de menace gardent threatMaterial : leur géométrie n'a pas de couleurs de sommet.
export function enemyBodyMaterial(): THREE.MeshStandardNodeMaterial {
  const mat = new THREE.MeshStandardNodeMaterial({
    color: PALETTE.threat,
    vertexColors: true,
    emissive: PALETTE.threat,
    emissiveIntensity: 0.08,
    roughness: 0.45,
    flatShading: true,
  });
  mat.aoNode = threatAmbient();
  mat.mrtNode = GLOW_MRT;
  return mat;
}

// Armes et mains : noir mat, avec un liseré clair (fresnel) pour se lire devant le vide sombre.
export function inkMaterial(): THREE.MeshStandardNodeMaterial {
  const mat = new THREE.MeshStandardNodeMaterial({ color: PALETTE.ink, roughness: 0.6, flatShading: true });
  const facing = max(dot(normalView, positionViewDirection), float(0));
  // Puissance 5 : sur des pavés à faces plates, le liseré ne doit éclairer que les faces presque rasantes,
  // pas des faces entières (réglé au plan 3 avec le pistolet en code : à la puissance 3, l'arme virait au gris).
  mat.emissiveNode = color(PALETTE.world).mul(float(1).sub(facing).pow(5)).mul(0.6);
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
