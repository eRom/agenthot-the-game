// Pistolet et mains, faits en code (spec 6.2 : noir mat `ink`, liseré clair). Calcul pur, sans Three.js.
// Repère d'une forme : origine au centre de la crosse (là où la main serre), −Z vers l'avant (bouche du canon),
// +Y vers le haut, +X à droite du tireur. Ainsi, poser l'origine dans la main d'un ennemi y met la crosse.

// Pistolet : profil de côté (u vers l'avant, soit −Z ; v vers le haut ; en m ; crosse centrée sur u = 0 à v = 0),
// extrudé sur `width` avec des arêtes chanfreinées. Le profil fait le tour dans le sens trigonométrique ;
// le trou est l'ouverture du pontet.
export const PISTOL = {
  width: 0.026,
  bevel: 0.004,
  outline: [
    [-0.02, 0.09], // arrière de la culasse
    [-0.026, 0.066],
    [-0.014, 0.05], // queue de castor
    [-0.038, -0.052], // dos de la crosse
    [-0.036, -0.066], // talon du chargeur
    [0.01, -0.066],
    [0.012, -0.052],
    [0.032, 0.024], // devant de la crosse
    [0.038, 0.012], // pontet, dessous
    [0.088, 0.014],
    [0.098, 0.038], // pontet, avant
    [0.16, 0.04], // carcasse sous le canon
    [0.16, 0.056],
    [0.178, 0.058], // bouche du canon
    [0.178, 0.088],
    [0.17, 0.092], // dessus de la culasse
    [-0.01, 0.092],
  ] as readonly (readonly [number, number])[],
  // 22 mm de haut : le chanfrein (4 mm par bord) en mange 8, il reste une vraie ouverture lisible en jeu.
  guardHole: [
    [0.044, 0.018],
    [0.084, 0.018],
    [0.09, 0.04],
    [0.046, 0.04],
  ] as readonly (readonly [number, number])[],
} as const;

// Un pavé chanfreiné, ou un membre (prisme effilé le long de son axe Y) : taille ou rayons, centre, et
// inclinaison autour de l'axe X (radians ; négatif = le haut part vers l'avant).
export type Part =
  | { kind: "box"; size: readonly [number, number, number]; pos: readonly [number, number, number]; tilt?: number }
  | {
      kind: "limb";
      radiusTop: number;
      radiusBottom: number;
      length: number;
      pos: readonly [number, number, number];
      tilt?: number;
      // Rotation autour de Z, appliquée avant l'inclinaison : π/2 couche le membre en travers.
      roll?: number;
    };

// Inclinaison de la crosse : le haut vers l'avant, comme le profil du pistolet.
const GRIP_RAKE = -0.22;
// Avant-bras : son axe monte vers l'avant, du coude au poignet (0,45 vers le haut pour 0,89 vers l'avant).
const FOREARM_TILT = -1.1;
// Membre couché vers l'avant (axe Y tourné vers −Z) ou en travers (axe Y tourné vers X).
const FORWARD = -Math.PI / 2;
const HALF_TURN = Math.PI / 2;

// Main droite refermée sur la crosse, avec l'avant-bras (vue à la première personne).
export const GRIP_HAND: readonly Part[] = [
  // Trois doigts enroulés devant la crosse, en travers (axe X), du majeur à l'auriculaire.
  { kind: "limb", radiusTop: 0.0115, radiusBottom: 0.0115, length: 0.056, pos: [0.004, 0, -0.035], roll: HALF_TURN },
  { kind: "limb", radiusTop: 0.011, radiusBottom: 0.011, length: 0.054, pos: [0.004, -0.023, -0.03], roll: HALF_TURN },
  { kind: "limb", radiusTop: 0.0095, radiusBottom: 0.0095, length: 0.05, pos: [0.004, -0.045, -0.025], roll: HALF_TURN },
  // Index tendu le long du pontet, côté droit ; pouce le long de la carcasse, côté gauche.
  { kind: "limb", radiusTop: 0.0085, radiusBottom: 0.0095, length: 0.055, pos: [0.018, 0.03, -0.05], tilt: FORWARD },
  { kind: "limb", radiusTop: 0.0095, radiusBottom: 0.011, length: 0.05, pos: [-0.019, 0.045, -0.03], tilt: FORWARD },
  { kind: "box", size: [0.022, 0.075, 0.062], pos: [0.024, -0.014, -0.004], tilt: GRIP_RAKE }, // dos de la main, à droite
  // Talon de la paume, à gauche et en arrière : de ce côté (celui que voit le joueur), on lit les bouts des doigts.
  { kind: "box", size: [0.016, 0.05, 0.03], pos: [-0.019, -0.03, 0.02], tilt: GRIP_RAKE },
  // Avant-bras : du poignet, derrière le bas de la crosse, vers le coude, en bas de l'écran (haut du prisme au poignet).
  { kind: "limb", radiusTop: 0.025, radiusBottom: 0.031, length: 0.22, pos: [0.012, -0.1, 0.13], tilt: FOREARM_TILT },
];

// Poing fermé, mains vides : origine au creux du poing, avec l'avant-bras.
export const FIST: readonly Part[] = [
  // Quatre doigts repliés, en travers, de l'index (en haut) à l'auriculaire.
  { kind: "limb", radiusTop: 0.012, radiusBottom: 0.012, length: 0.05, pos: [0.004, 0.024, -0.026], roll: HALF_TURN },
  { kind: "limb", radiusTop: 0.0125, radiusBottom: 0.0125, length: 0.052, pos: [0.004, 0.002, -0.028], roll: HALF_TURN },
  { kind: "limb", radiusTop: 0.012, radiusBottom: 0.012, length: 0.05, pos: [0.004, -0.02, -0.026], roll: HALF_TURN },
  { kind: "limb", radiusTop: 0.0105, radiusBottom: 0.0105, length: 0.046, pos: [0.004, -0.04, -0.022], roll: HALF_TURN },
  { kind: "box", size: [0.056, 0.078, 0.05], pos: [0.004, -0.006, 0.006] }, // paume et dos de la main
  // Pouce replié devant les doigts du milieu, côté gauche (celui que voit le joueur).
  { kind: "limb", radiusTop: 0.0095, radiusBottom: 0.011, length: 0.036, pos: [-0.016, -0.004, -0.044], roll: HALF_TURN },
  { kind: "limb", radiusTop: 0.025, radiusBottom: 0.031, length: 0.22, pos: [0.004, -0.09, 0.12], tilt: FOREARM_TILT },
];

export interface Bounds {
  min: [number, number, number];
  max: [number, number, number];
}

// Boîte englobante d'une forme (un membre compte pour le pavé qui l'enveloppe), inclinaisons comprises.
export function shapeBounds(parts: readonly Part[]): Bounds {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const part of parts) {
    const r = part.kind === "limb" ? Math.max(part.radiusTop, part.radiusBottom) : 0;
    // Membre couché en travers (roulis) : son enveloppe s'allonge sur X au lieu de Y.
    const across = part.kind === "limb" && Math.abs(part.roll ?? 0) > Math.PI / 4;
    const size =
      part.kind === "box"
        ? part.size
        : across
          ? ([part.length, 2 * r, 2 * r] as const)
          : ([2 * r, part.length, 2 * r] as const);
    const c = Math.cos(part.tilt ?? 0);
    const s = Math.sin(part.tilt ?? 0);
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const x = (sx * size[0]) / 2;
          const y = (sy * size[1]) / 2;
          const z = (sz * size[2]) / 2;
          const p = [part.pos[0] + x, part.pos[1] + y * c - z * s, part.pos[2] + y * s + z * c];
          for (let k = 0; k < 3; k++) {
            min[k] = Math.min(min[k]!, p[k]!);
            max[k] = Math.max(max[k]!, p[k]!);
          }
        }
      }
    }
  }
  return { min, max };
}

// Pose de l'arme en main à la première personne, décalage dans le repère de la caméra (m, rad).
export interface ViewModelOffset {
  // Recul vers l'arrière (+Z) et relevé du canon (rotation autour de X, > 0 = vers le haut).
  back: number;
  lift: number;
}

export const VIEW_MODEL = {
  // Recul au tir : l'arme part de `kickBack` m en arrière et se relève de `kickLift` rad, puis revient
  // pendant les `kickTime` premières secondes du temps de recharge (temps de simulation : au ralenti, le recul
  // se voit au ralenti).
  kickBack: 0.06,
  kickLift: 0.22,
  kickTime: 0.15,
  // Coup de poing : aller-retour de `jabReach` m en `jabTime` s de simulation.
  jabReach: 0.28,
  jabTime: 0.22,
} as const;

// Recul d'après le temps de recharge restant : `cooldown` part de `fullCooldown` au tir et descend vers 0.
export function kickOffset(cooldown: number, fullCooldown: number, out: ViewModelOffset): ViewModelOffset {
  const sinceShot = fullCooldown - cooldown;
  const k = cooldown > 0 && sinceShot < VIEW_MODEL.kickTime ? 1 - sinceShot / VIEW_MODEL.kickTime : 0;
  // Retour adouci : rapide au début, posé à la fin.
  const eased = k * k;
  out.back = VIEW_MODEL.kickBack * eased;
  out.lift = VIEW_MODEL.kickLift * eased;
  return out;
}

// Coup de poing d'après le temps écoulé depuis l'appui (s de simulation), 0 hors du coup.
export function jabOffset(age: number): number {
  if (age < 0 || age >= VIEW_MODEL.jabTime) return 0;
  // Aller vif, retour plus lent : sommet au tiers du coup.
  const t = age / VIEW_MODEL.jabTime;
  const shape = t < 1 / 3 ? t * 3 : 1 - (t - 1 / 3) * 1.5;
  return VIEW_MODEL.jabReach * Math.max(0, shape);
}
