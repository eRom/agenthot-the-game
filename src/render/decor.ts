// Décor de la salle serveurs (essai de rendu du 2026-09-30) : dallage au sol, baies détaillées, plafond à dalles
// suspendues, bandeaux lumineux. Tout est fabriqué en code, une fois, au chargement : rien ne s'alloue par image.
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { abs, color, float, fract, fwidth, max, min, mix, positionWorld } from "three/tsl";
import * as THREE from "three/webgpu";
import { PALETTE } from "./palette";

export const DECOR = {
  // Dalles de faux plancher : 60 cm, comme dans une vraie salle serveurs.
  tileSize: 0.6,
  // Épaisseur du joint, en pixels à l'écran.
  jointPixels: 1.1,
  joint: 0xaeb2ba,
  rack: 0xf1f1ee,
  // Teinte des tiroirs, en part du blanc de la baie : ils se détachent du châssis sans trait.
  drawerTint: 0.9,
  // Plafond : dalle lumineuse à 6 m, panneaux suspendus dessous.
  panelY: 5.25,
  panelSize: 2.15,
  panelPitch: 2.4,
  panel: 0xf4f4f2,
  // Bandeau lumineux des murs.
  stripY: 2.75,
  stripHeight: 0.12,
} as const;

// Sol : blanc cassé, joints fins dessinés par le shader (largeur constante à l'écran, estompés au loin pour
// ne pas moirer).
export function floorMaterial(): THREE.MeshStandardNodeMaterial {
  const mat = new THREE.MeshStandardNodeMaterial({ roughness: 0.85 });
  const p = positionWorld.xz.div(DECOR.tileSize);
  const width = fwidth(p);
  const toLine = abs(fract(p.sub(0.5)).sub(0.5)).div(width);
  const line = float(1).sub(min(min(toLine.x, toLine.y).div(DECOR.jointPixels), 1));
  // Au loin, une dalle fait moins de quelques pixels : le joint se fond dans le sol.
  const fade = float(1).sub(max(width.x, width.y).mul(2.5).clamp());
  mat.colorNode = mix(color(PALETTE.world), color(DECOR.joint), line.mul(fade));
  return mat;
}

export function rackMaterial(): THREE.MeshStandardNodeMaterial {
  return new THREE.MeshStandardNodeMaterial({ color: DECOR.rack, roughness: 0.8, vertexColors: true });
}

// Dimensions d'une baie, en mètres : profondeur (x), hauteur (y), largeur (z). Les rangées courent le long de z,
// les deux faces (+x et -x) donnent sur les allées.
export interface RackSize {
  depth: number;
  height: number;
  width: number;
}

function tinted(geo: THREE.BufferGeometry, tint: number): THREE.BufferGeometry {
  const count = geo.getAttribute("position").count;
  const colors = new Float32Array(count * 3).fill(tint);
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

function part(sx: number, sy: number, sz: number, x: number, y: number, z: number, tint = 1): THREE.BufferGeometry {
  return tinted(new THREE.BoxGeometry(sx, sy, sz).translate(x, y, z), tint);
}

// Hauteurs des tiroirs d'une face, du bas vers le haut, en unités de 4,5 cm (un « U »). 0 = emplacement vide,
// où pendent des câbles. Deux faces différentes : une baie tournée d'un demi-tour ne ressemble pas à sa voisine.
const FRONT_UNITS = [4, 2, 2, 0, 6, 2, 4, 2, 0, 2, 8, 2, 4, 2, 2];
const BACK_UNITS = [2, 6, 2, 2, 0, 4, 4, 2, 8, 0, 2, 2, 6, 2];
const UNIT = 0.045;
const EMPTY_UNITS = 5;

// Une baie : châssis ouvert sur ses deux faces, tiroirs en retrait de profondeurs inégales, paquets de câbles.
// Centrée sur l'origine, à taille réelle : les instances ne portent qu'une position (et un demi-tour).
export function rackGeometry(size: RackSize): THREE.BufferGeometry {
  const { depth, height, width } = size;
  const parts: THREE.BufferGeometry[] = [];
  const wall = 0.03;
  // Châssis : deux flancs, un toit, un socle, et un cœur plein (on ne voit pas à travers).
  parts.push(part(depth, height, wall, 0, 0, width / 2 - wall / 2));
  parts.push(part(depth, height, wall, 0, 0, -width / 2 + wall / 2));
  parts.push(part(depth, 0.05, width, 0, height / 2 - 0.025, 0));
  parts.push(part(depth, 0.1, width, 0, -height / 2 + 0.05, 0));
  const core = depth * 0.24;
  parts.push(part(core * 2, height - 0.15, width - wall * 2, 0, -0.025, 0, 0.82));

  const inner = width - wall * 2 - 0.02;
  const bottom = -height / 2 + 0.1;
  const top = height / 2 - 0.05;
  const faces: [number, readonly number[]][] = [
    [1, FRONT_UNITS],
    [-1, BACK_UNITS],
  ];
  for (const [side, units] of faces) {
    let y = bottom + 0.01;
    units.forEach((u, i) => {
      const h = (u === 0 ? EMPTY_UNITS : u) * UNIT;
      if (y + h > top) return;
      if (u === 0) {
        // Emplacement vide : une étagère fine et des boucles de câbles qui pendent.
        parts.push(part(depth / 2 - core - 0.06, 0.012, inner, side * (core + (depth / 2 - core - 0.06) / 2), y + h - 0.006, 0, 0.95));
        const loops = 5;
        for (let k = 0; k < loops; k++) {
          const radius = 0.05 + ((i * 7 + k * 3) % 5) * 0.012;
          const loop = new THREE.TorusGeometry(radius, 0.008, 5, 10, Math.PI);
          // L'arc pend vers le bas, dans le plan de la face.
          loop.rotateZ(Math.PI).rotateY(Math.PI / 2);
          const z = -inner / 2 + 0.09 + (k / (loops - 1)) * (inner - 0.18);
          loop.translate(side * (core + 0.06 + (k % 2) * 0.05), y + h - 0.02, z);
          parts.push(tinted(loop, 1));
        }
      } else {
        // Tiroir : sa profondeur varie, sa face reste en retrait du châssis (l'ombre des coins fait le relief).
        const reach = depth / 2 - core - 0.035 - ((i * 5 + (side > 0 ? 0 : 2)) % 4) * 0.03;
        parts.push(part(reach, h - 0.012, inner, side * (core + reach / 2), y + h / 2, 0, DECOR.drawerTint));
        // Poignée : une barre fine en saillie.
        if (u >= 4) parts.push(part(0.014, 0.014, inner * 0.55, side * (core + reach + 0.007), y + h * 0.7, 0));
      }
      y += h;
    });
  }
  const merged = mergeGeometries(parts);
  for (const geo of parts) geo.dispose();
  return merged;
}

// Plafond : une dalle lumineuse à la hauteur des murs, des panneaux suspendus dessous (la lumière passe entre eux),
// et un bandeau lumineux sur les quatre murs.
export function buildCeiling(halfX: number, halfZ: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  const light = new THREE.MeshBasicNodeMaterial({ color: 0xffffff });
  const slab = new THREE.Mesh(new THREE.PlaneGeometry(halfX * 2, halfZ * 2), light);
  slab.rotation.x = Math.PI / 2;
  slab.position.y = height - 0.01;
  group.add(slab);

  const cols = Math.floor((halfX * 2) / DECOR.panelPitch);
  const rows = Math.floor((halfZ * 2) / DECOR.panelPitch);
  const panelMat = new THREE.MeshStandardNodeMaterial({ color: DECOR.panel, roughness: 0.9 });
  const panels = new THREE.InstancedMesh(new THREE.BoxGeometry(DECOR.panelSize, 0.08, DECOR.panelSize), panelMat, cols * rows);
  const m = new THREE.Matrix4();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      m.makeTranslation((c - (cols - 1) / 2) * DECOR.panelPitch, DECOR.panelY, (r - (rows - 1) / 2) * DECOR.panelPitch);
      panels.setMatrixAt(r * cols + c, m);
    }
  }
  group.add(panels);

  const t = 0.04;
  const strips = mergeGeometries([
    new THREE.BoxGeometry(halfX * 2, DECOR.stripHeight, t).translate(0, DECOR.stripY, -halfZ + t / 2),
    new THREE.BoxGeometry(halfX * 2, DECOR.stripHeight, t).translate(0, DECOR.stripY, halfZ - t / 2),
    new THREE.BoxGeometry(t, DECOR.stripHeight, halfZ * 2).translate(-halfX + t / 2, DECOR.stripY, 0),
    new THREE.BoxGeometry(t, DECOR.stripHeight, halfZ * 2).translate(halfX - t / 2, DECOR.stripY, 0),
  ]);
  group.add(new THREE.Mesh(strips, light));
  return group;
}
