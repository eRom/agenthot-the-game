// Corps des ennemis : 8 segments facettés façon cristal, un InstancedMesh par segment pour tous les ennemis.
// 8 appels de dessin quel que soit le nombre d'ennemis (spec 9.2).
import * as THREE from "three/webgpu";
import { POOLS } from "../sim/entities";
import type { EnemyView } from "../sim/view";
import { segmentMesh } from "./enemy-geometry";
import { type EnemyPose, SEGMENT_COUNT, createEnemyPose, poseEnemy } from "./enemy-pose";
import { PALETTE } from "./palette";

// Géométrie d'un segment (enemy-geometry.ts), centrée sur l'origine et alignée sur Y (ordre de SEGMENT).
// Non indexée : chaque triangle a sa normale et sa couleur de sommet. Le matériau porte la teinte `threat` ;
// la couleur de sommet la multiplie : luminosité de la facette, et part de `threat-hot` pour ses éclats.
function segmentGeometry(segment: number): THREE.BufferGeometry {
  const { positions, brightness, glint } = segmentMesh(segment);
  // Rapport threat-hot / threat, canal par canal (espace linéaire) : threat × (1 + (k − 1) × t) = mélange des deux.
  const threat = new THREE.Color(PALETTE.threat);
  const hot = new THREE.Color(PALETTE.threatHot);
  const kr = hot.r / threat.r - 1;
  const kg = hot.g / threat.g - 1;
  const kb = hot.b / threat.b - 1;
  const colors = new Float32Array(positions.length);
  for (let f = 0; f < brightness.length; f++) {
    const b = brightness[f]!;
    const t = glint[f]!;
    for (let v = 0; v < 3; v++) {
      const o = f * 9 + v * 3;
      colors[o] = b * (1 + kr * t);
      colors[o + 1] = b * (1 + kg * t);
      colors[o + 2] = b * (1 + kb * t);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export class EnemyBodies {
  readonly meshes: THREE.InstancedMesh[] = [];
  private readonly poses: EnemyPose[] = [];
  // Objets temporaires réutilisés : zéro allocation par image.
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly euler = new THREE.Euler(0, 0, 0, "YXZ");
  private readonly p = new THREE.Vector3();
  private readonly one = new THREE.Vector3(1, 1, 1);
  private readonly hidden = new THREE.Matrix4().makeScale(0, 0, 0);

  constructor(material: THREE.Material) {
    for (let s = 0; s < SEGMENT_COUNT; s++) {
      const mesh = new THREE.InstancedMesh(segmentGeometry(s), material, POOLS.enemies);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      for (let i = 0; i < POOLS.enemies; i++) mesh.setMatrixAt(i, this.hidden);
      this.meshes.push(mesh);
    }
    for (let i = 0; i < POOLS.enemies; i++) this.poses.push(createEnemyPose());
  }

  // Pose de l'ennemi i, calculée au dernier update (main droite, lacet, avant-bras).
  pose(i: number): EnemyPose {
    return this.poses[i]!;
  }

  update(enemies: readonly EnemyView[]): void {
    for (let i = 0; i < POOLS.enemies; i++) {
      const e = enemies[i]!;
      if (!e.visible) {
        for (let s = 0; s < SEGMENT_COUNT; s++) this.meshes[s]!.setMatrixAt(i, this.hidden);
        continue;
      }
      const pose = poseEnemy(e, this.poses[i]!);
      for (let s = 0; s < SEGMENT_COUNT; s++) {
        const seg = pose.segments[s]!;
        this.euler.set(seg.pitch, pose.yaw, seg.roll, "YXZ");
        this.q.setFromEuler(this.euler);
        this.p.set(seg.pos.x, seg.pos.y, seg.pos.z);
        this.m.compose(this.p, this.q, this.one);
        this.meshes[s]!.setMatrixAt(i, this.m);
      }
    }
    for (let s = 0; s < SEGMENT_COUNT; s++) this.meshes[s]!.instanceMatrix.needsUpdate = true;
  }
}
