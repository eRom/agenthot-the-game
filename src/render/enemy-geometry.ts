// Géométrie des corps ennemis, façon cristal (spec 5.6 et 6.2) : calcul pur, sans Three.js, testé avec bun.
// Chaque segment est un profil anatomique (anneaux elliptiques du bas vers le haut, fermés par deux pôles),
// dont les sommets sont déplacés au hasard, avec une graine fixe : même graine, même corps, à chaque chargement.
// Sortie non indexée : chaque triangle a ses trois sommets à lui, donc sa propre facette nette et sa propre teinte.
import { Rng } from "../sim/rng";
import { SEGMENT, SEGMENT_COUNT } from "./enemy-pose";

export const FACETS = {
  // Graine de base ; chaque segment tire la sienne (le bras gauche et le droit ne sont pas des copies).
  seed: 0x5eed,
  // Variation de luminosité de chaque facette autour de la teinte `threat` : ±12 %.
  tint: 0.12,
  // Facettes sombres, semées parmi les autres comme sur les corps de SUPERHOT (références
  // docs/superpowers/idea/screenshots/) : un quart des facettes, à 68-80 % de l'orange. Réglé à l'écran le
  // 2026-09-29 : le ±12 % seul donnait un mannequin d'argile, le cristal ne se lisait pas.
  darkShare: 0.25,
  darkMin: 0.68,
  darkMax: 0.8,
  // Éclats de lumière : 12 % des facettes tirent vers `threat-hot` (spec 6.1 : « arêtes des ennemis »),
  // d'une fraction comprise entre glintMin et 1.
  glintShare: 0.12,
  glintMin: 0.5,
  // Déplacement des sommets d'un anneau : rayon (±14 %), angle (±30 % du pas entre deux côtés),
  // hauteur (±25 % de l'écart à l'anneau voisin le plus proche).
  radialJitter: 0.14,
  angleJitter: 0.3,
  heightJitter: 0.25,
  // Chaque anneau tourne d'une fraction aléatoire du pas : les arêtes ne s'alignent plus en colonnes.
  twist: 0.5,
  // Déplacement d'un pôle dans le plan horizontal, en fraction du rayon de l'anneau voisin.
  poleJitter: 0.2,
} as const;

// Un anneau du profil. Repère du segment : axe le long de Y, −Z vers l'avant de l'ennemi (comme la pose).
interface Ring {
  y: number;
  // Demi-largeur (x) et demi-profondeur (z).
  rx: number;
  rz: number;
  // Décalage avant (−) ou arrière (+) du centre de l'anneau.
  z?: number;
}

interface Profile {
  sides: number;
  // Pôles fermant le bas et le haut du segment.
  bottom: { y: number; z?: number };
  top: { y: number; z?: number };
  // Du bas vers le haut, strictement croissants en y.
  rings: Ring[];
}

// Profils anatomiques (m), centrés sur le milieu du segment (longueurs de BODY dans enemy-pose.ts).
// Les bouts dépassent un peu des articulations (épaule, coude, hanche) : un membre plié ne laisse pas de trou.
const HEAD: Profile = {
  sides: 9,
  // Le cou descend dans les trapèzes du torse.
  bottom: { y: -0.2, z: 0.01 },
  top: { y: 0.145, z: 0.01 },
  rings: [
    { y: -0.18, rx: 0.05, rz: 0.052, z: 0.012 },
    { y: -0.12, rx: 0.062, rz: 0.076, z: -0.004 }, // mâchoire
    { y: -0.06, rx: 0.08, rz: 0.094 },
    { y: 0.01, rx: 0.088, rz: 0.1, z: 0.006 },
    { y: 0.075, rx: 0.082, rz: 0.095, z: 0.01 },
    { y: 0.12, rx: 0.055, rz: 0.066, z: 0.012 },
  ],
};

const TORSO: Profile = {
  sides: 10,
  // Le bassin descend nettement sous les hanches (entrejambe) et enveloppe le haut des cuisses : de près,
  // aucune marche entre le bassin et les jambes (plan 2, report 23).
  bottom: { y: -0.4, z: 0.01 },
  top: { y: 0.32 },
  rings: [
    { y: -0.37, rx: 0.12, rz: 0.08, z: 0.01 }, // entrejambe
    { y: -0.31, rx: 0.18, rz: 0.105, z: 0.012 }, // bas du bassin, aussi large que les deux cuisses
    { y: -0.24, rx: 0.19, rz: 0.112, z: 0.012 }, // bassin : il couvre le haut des cuisses
    { y: -0.14, rx: 0.15, rz: 0.1, z: 0.005 },
    { y: -0.04, rx: 0.14, rz: 0.095 }, // taille
    { y: 0.05, rx: 0.165, rz: 0.11, z: -0.01 },
    { y: 0.13, rx: 0.2, rz: 0.12, z: -0.012 }, // poitrine
    { y: 0.2, rx: 0.235, rz: 0.11, z: -0.005 }, // épaules
    { y: 0.255, rx: 0.15, rz: 0.085 }, // trapèzes
    { y: 0.29, rx: 0.055, rz: 0.05 }, // base du cou
  ],
};

const UPPER_ARM: Profile = {
  sides: 8,
  bottom: { y: -0.175 },
  // Deltoïde : il coiffe l'épaule.
  top: { y: 0.2 },
  rings: [
    { y: -0.15, rx: 0.042, rz: 0.045 }, // coude
    { y: -0.08, rx: 0.048, rz: 0.05 },
    { y: 0, rx: 0.055, rz: 0.058, z: -0.005 }, // biceps
    { y: 0.08, rx: 0.06, rz: 0.06 },
    { y: 0.145, rx: 0.068, rz: 0.066 }, // deltoïde
  ],
};

const FOREARM: Profile = {
  sides: 8,
  // Le poing dépasse un peu la main de la pose, où l'arme est tenue.
  bottom: { y: -0.21 },
  top: { y: 0.165 },
  rings: [
    { y: -0.19, rx: 0.035, rz: 0.04 },
    { y: -0.15, rx: 0.045, rz: 0.05 }, // poing
    { y: -0.115, rx: 0.03, rz: 0.032 }, // poignet
    { y: -0.03, rx: 0.037, rz: 0.04 },
    { y: 0.06, rx: 0.046, rz: 0.049 }, // l'avant-bras est le plus large sous le coude
    { y: 0.13, rx: 0.038, rz: 0.04 }, // coude, plus fin que le bras : pas de manchette
  ],
};

const LEG: Profile = {
  sides: 9,
  // Semelle plate au ras du sol (bas du segment), pied tourné vers l'avant (−Z).
  bottom: { y: -0.475, z: -0.045 },
  // Le haut de la cuisse est une rotule qui monte dans le bassin : jambe pliée, rien ne dépasse à la hanche.
  top: { y: 0.56 },
  rings: [
    { y: -0.475, rx: 0.048, rz: 0.11, z: -0.045 }, // semelle
    { y: -0.44, rx: 0.048, rz: 0.085, z: -0.03 }, // coup de pied
    { y: -0.39, rx: 0.038, rz: 0.042 }, // cheville
    { y: -0.25, rx: 0.048, rz: 0.054, z: 0.006 },
    { y: -0.1, rx: 0.06, rz: 0.066, z: 0.014 }, // mollet
    { y: 0, rx: 0.056, rz: 0.058 }, // genou
    { y: 0.15, rx: 0.075, rz: 0.08 },
    { y: 0.3, rx: 0.09, rz: 0.095, z: -0.006 }, // cuisse
    { y: 0.44, rx: 0.085, rz: 0.092 }, // haut de cuisse, rentré dans le bassin
    { y: 0.51, rx: 0.07, rz: 0.076 }, // rotule de hanche, dans le bassin
  ],
};

// Profil de chaque segment, dans l'ordre de SEGMENT (c'est aussi l'ordre des InstancedMesh).
const PROFILES: readonly Profile[] = (() => {
  const list: Profile[] = [];
  list[SEGMENT.head] = HEAD;
  list[SEGMENT.torso] = TORSO;
  list[SEGMENT.upperArmL] = UPPER_ARM;
  list[SEGMENT.upperArmR] = UPPER_ARM;
  list[SEGMENT.forearmL] = FOREARM;
  list[SEGMENT.forearmR] = FOREARM;
  list[SEGMENT.legL] = LEG;
  list[SEGMENT.legR] = LEG;
  return list;
})();

export interface FacetedMesh {
  // Positions non indexées : 3 sommets, soit 9 flottants, par facette.
  positions: Float32Array;
  // Luminosité de chaque facette, multiplicateur de la teinte `threat` : 1 ± FACETS.tint, ou sombre (darkMin-darkMax).
  brightness: Float32Array;
  // Part de `threat-hot` dans la teinte de chaque facette : 0 pour la plupart, entre glintMin et 1 sinon.
  glint: Float32Array;
}

// Géométrie du segment `segment` (index de SEGMENT). Déterministe : deux appels rendent les mêmes nombres.
export function segmentMesh(segment: number): FacetedMesh {
  if (segment < 0 || segment >= SEGMENT_COUNT) throw new Error(`unknown segment ${segment}`);
  const profile = PROFILES[segment]!;
  const rng = new Rng(FACETS.seed + segment * 7919);
  const n = profile.sides;
  const rings = profile.rings;
  const step = (Math.PI * 2) / n;

  // Sommets de chaque anneau, déplacés (x, y, z à la suite).
  const grid: number[][] = [];
  for (let j = 0; j < rings.length; j++) {
    const ring = rings[j]!;
    const below = j === 0 ? profile.bottom.y : rings[j - 1]!.y;
    const above = j === rings.length - 1 ? profile.top.y : rings[j + 1]!.y;
    const dy = Math.min(ring.y - below, above - ring.y) * FACETS.heightJitter;
    const twist = rng.next() * FACETS.twist * step;
    const points: number[] = [];
    for (let i = 0; i < n; i++) {
      const angle = i * step + twist + rng.range(-1, 1) * FACETS.angleJitter * step;
      const scale = 1 + rng.range(-1, 1) * FACETS.radialJitter;
      points.push(
        Math.cos(angle) * ring.rx * scale,
        ring.y + rng.range(-1, 1) * dy,
        (ring.z ?? 0) + Math.sin(angle) * ring.rz * scale,
      );
    }
    grid.push(points);
  }
  const first = rings[0]!;
  const last = rings[rings.length - 1]!;
  const bottom = [
    rng.range(-1, 1) * FACETS.poleJitter * first.rx,
    profile.bottom.y,
    (profile.bottom.z ?? 0) + rng.range(-1, 1) * FACETS.poleJitter * first.rz,
  ];
  const top = [
    rng.range(-1, 1) * FACETS.poleJitter * last.rx,
    profile.top.y,
    (profile.top.z ?? 0) + rng.range(-1, 1) * FACETS.poleJitter * last.rz,
  ];

  const facets = 2 * n * (rings.length - 1) + 2 * n;
  const positions = new Float32Array(facets * 9);
  const brightness = new Float32Array(facets);
  const glint = new Float32Array(facets);
  let f = 0;
  const emit = (a: readonly number[], ai: number, b: readonly number[], bi: number, c: readonly number[], ci: number) => {
    const o = f * 9;
    positions[o] = a[ai]!;
    positions[o + 1] = a[ai + 1]!;
    positions[o + 2] = a[ai + 2]!;
    positions[o + 3] = b[bi]!;
    positions[o + 4] = b[bi + 1]!;
    positions[o + 5] = b[bi + 2]!;
    positions[o + 6] = c[ci]!;
    positions[o + 7] = c[ci + 1]!;
    positions[o + 8] = c[ci + 2]!;
    const isDark = rng.next() < FACETS.darkShare;
    brightness[f] = isDark ? rng.range(FACETS.darkMin, FACETS.darkMax) : 1 + rng.range(-1, 1) * FACETS.tint;
    glint[f] = rng.next() < FACETS.glintShare ? rng.range(FACETS.glintMin, 1) : 0;
    f++;
  };

  // Flancs : chaque quadrilatère est coupé selon une diagonale tirée au hasard (facettes irrégulières).
  // Ordre des sommets : sens trigonométrique vu de l'extérieur (faces avant).
  for (let j = 0; j < rings.length - 1; j++) {
    const lo = grid[j]!;
    const hi = grid[j + 1]!;
    for (let i = 0; i < n; i++) {
      const a = i * 3;
      const b = ((i + 1) % n) * 3;
      if (rng.next() < 0.5) {
        emit(lo, a, hi, a, hi, b);
        emit(lo, a, hi, b, lo, b);
      } else {
        emit(lo, a, hi, a, lo, b);
        emit(lo, b, hi, a, hi, b);
      }
    }
  }
  // Pôles.
  const lo = grid[0]!;
  const hi = grid[rings.length - 1]!;
  for (let i = 0; i < n; i++) {
    const a = i * 3;
    const b = ((i + 1) % n) * 3;
    emit(bottom, 0, lo, a, lo, b);
    emit(top, 0, hi, b, hi, a);
  }
  return { positions, brightness, glint };
}
