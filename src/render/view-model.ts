// Arme et mains à la première personne, et géométrie du pistolet (formes de weapon-shapes.ts).
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import * as THREE from "three/webgpu";
import { PLAYER } from "../sim/entities";
import type { WorldView } from "../sim/view";
import { FIST, GRIP_HAND, PISTOL, type Part, type ViewModelOffset, jabOffset, kickOffset } from "./weapon-shapes";

// Part de la plus petite dimension d'un pavé prise par ses chanfreins : le liseré accroche les arêtes.
const CHAMFER = 0.18;
// Côtés d'un membre : assez pour qu'il paraisse rond, assez peu pour garder des facettes.
const LIMB_SIDES = 7;

// Pavé aux arêtes chanfreinées (extrusion d'un rectangle), centré sur l'origine.
function chamferedBox(x: number, y: number, z: number): THREE.BufferGeometry {
  const bevel = Math.min(x, y, z) * CHAMFER;
  const w = x / 2 - bevel;
  const h = y / 2 - bevel;
  const shape = new THREE.Shape([
    new THREE.Vector2(-w, -h),
    new THREE.Vector2(w, -h),
    new THREE.Vector2(w, h),
    new THREE.Vector2(-w, h),
  ]);
  const depth = z - 2 * bevel;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
  });
  return geometry.translate(0, 0, -depth / 2);
}

// Pavés et membres d'une forme, fusionnés en une seule géométrie : un seul appel de dessin.
export function shapeGeometry(parts: readonly Part[]): THREE.BufferGeometry {
  const matrix = new THREE.Matrix4();
  const rollMatrix = new THREE.Matrix4();
  const pieces = parts.map((part) => {
    const piece =
      part.kind === "box"
        ? chamferedBox(part.size[0], part.size[1], part.size[2])
        : new THREE.CylinderGeometry(part.radiusTop, part.radiusBottom, part.length, LIMB_SIDES);
    const roll = part.kind === "limb" ? (part.roll ?? 0) : 0;
    matrix
      .makeRotationX(part.tilt ?? 0)
      .multiply(rollMatrix.makeRotationZ(roll))
      .setPosition(part.pos[0], part.pos[1], part.pos[2]);
    // Les extrusions portent des UV et des groupes que les cylindres n'ont pas : on ne garde que la forme.
    return stripToShape(piece.applyMatrix4(matrix));
  });
  return mergeGeometries(pieces);
}

// Pistolet : profil de côté extrudé, arêtes chanfreinées, tourné pour que le profil regarde vers −Z.
export function pistolGeometry(): THREE.BufferGeometry {
  const toVec = ([u, v]: readonly [number, number]) => new THREE.Vector2(u, v);
  const shape = new THREE.Shape(PISTOL.outline.map(toVec));
  shape.holes.push(new THREE.Path(PISTOL.guardHole.map(toVec)));
  const depth = PISTOL.width - 2 * PISTOL.bevel;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: PISTOL.bevel,
    bevelSize: PISTOL.bevel,
    bevelSegments: 1,
    curveSegments: 1,
  });
  // Profil dans le plan (u, v), épaisseur le long de z : centrée, puis u (l'avant) tourné vers −Z.
  geometry.translate(0, 0, -depth / 2).rotateY(Math.PI / 2);
  return stripToShape(geometry);
}

// Garde la position et la normale : toutes les pièces fusionnées ont alors les mêmes attributs.
function stripToShape(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", flat.getAttribute("position"));
  out.computeVertexNormals();
  return out;
}

// Place de la main droite dans le champ, repère de la caméra : à droite, sous l'axe de visée, le canon
// légèrement tourné vers le centre de l'écran.
const REST = { x: 0.16, y: -0.15, z: -0.42, yaw: 0.1 } as const;
// Le poing est tourné vers le centre : on voit ses doigts repliés, pas le dos de la main.
const FIST_REST = { x: 0.17, y: -0.16, z: -0.4, yaw: 0.7 } as const;

export class ViewModel {
  readonly group = new THREE.Group();
  private readonly armed: THREE.Mesh;
  private readonly fist: THREE.Mesh;
  // Temps de simulation écoulé depuis le dernier coup de poing (infini : pas de coup en cours).
  private punchAge = Number.POSITIVE_INFINITY;
  private readonly offset: ViewModelOffset = { back: 0, lift: 0 };

  constructor(material: THREE.Material) {
    this.armed = new THREE.Mesh(mergeGeometries([pistolGeometry(), shapeGeometry(GRIP_HAND)]), material);
    this.fist = new THREE.Mesh(shapeGeometry(FIST), material);
    this.group.add(this.armed, this.fist);
  }

  // Le joueur vient de frapper : le poing part.
  punch(): void {
    this.punchAge = 0;
  }

  // `dtSim` : temps de simulation de l'image (le recul et le coup ralentissent avec le temps).
  update(view: WorldView, dtSim: number): void {
    this.punchAge += dtSim;
    const armed = view.playerAmmo >= 0;
    this.armed.visible = armed;
    this.fist.visible = !armed;
    if (armed) {
      kickOffset(view.playerCooldown, PLAYER.fireCooldown, this.offset);
      this.armed.position.set(REST.x, REST.y, REST.z + this.offset.back);
      this.armed.rotation.set(this.offset.lift, REST.yaw, 0);
    } else {
      this.fist.position.set(FIST_REST.x, FIST_REST.y, FIST_REST.z - jabOffset(this.punchAge));
      this.fist.rotation.set(0, FIST_REST.yaw, 0);
    }
  }
}
