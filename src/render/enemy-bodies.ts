// Corps des ennemis : 8 segments facettés low-poly, un InstancedMesh par segment pour tous les ennemis.
// 8 appels de dessin quel que soit le nombre d'ennemis (spec 9.2).
import * as THREE from "three/webgpu";
import { POOLS } from "../sim/entities";
import type { EnemyView } from "../sim/view";
import { BODY, type EnemyPose, SEGMENT_COUNT, createEnemyPose, poseEnemy } from "./enemy-pose";

// Géométrie de chaque segment, centrée sur l'origine et alignée sur Y (ordre de SEGMENT).
// Peu de côtés et flatShading : chaque facette prend sa propre lumière.
function segmentGeometries(): THREE.BufferGeometry[] {
  return [
    new THREE.IcosahedronGeometry(BODY.headSize * 0.5, 0),
    new THREE.CylinderGeometry(0.2, 0.14, BODY.torsoLength, 6).scale(1, 1, 0.65),
    new THREE.CylinderGeometry(0.065, 0.05, BODY.upperArm, 5),
    new THREE.CylinderGeometry(0.065, 0.05, BODY.upperArm, 5),
    new THREE.CylinderGeometry(0.05, 0.04, BODY.forearm, 5),
    new THREE.CylinderGeometry(0.05, 0.04, BODY.forearm, 5),
    new THREE.CylinderGeometry(0.085, 0.055, BODY.legLength, 5),
    new THREE.CylinderGeometry(0.085, 0.055, BODY.legLength, 5),
  ];
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
    const geometries = segmentGeometries();
    for (let s = 0; s < SEGMENT_COUNT; s++) {
      const mesh = new THREE.InstancedMesh(geometries[s]!, material, POOLS.enemies);
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
