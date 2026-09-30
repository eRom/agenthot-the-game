// Rendu du monde : dessine une WorldView (jeu ou replay) sans jamais modifier la simulation.
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import * as THREE from "three/webgpu";
import type { RoomDefinition } from "../rooms/types";
import { PLAYER_ID, POOLS } from "../sim/entities";
import { SHATTER } from "../sim/shatter";
import type { WorldView } from "../sim/view";
import { BULLET_LOOK, headScale, trailLength } from "./bullet-look";
import { buildCeiling, floorMaterial, rackGeometry, rackMaterial } from "./decor";
import { EnemyBodies } from "./enemy-bodies";
import { aimLineMaterial, enemyBodyMaterial, inkMaterial, threatBasicMaterial, threatMaterial, worldMaterial } from "./materials";
import { PALETTE } from "./palette";
import { ViewModel, pistolGeometry } from "./view-model";

// Lumière de la salle (essai de rendu du 2026-09-30).
export const LOOK = {
  ambient: 2.8,
  groundLight: 0xf2f2f2,
  sun: 0.7,
} as const;

export class WorldRenderer {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private readonly racks: THREE.InstancedMesh;
  private readonly rackMatrices: THREE.Matrix4[] = [];
  private readonly bodies: EnemyBodies;
  // Traits de visée de tous les ennemis : un seul LineSegments (2 sommets par ennemi).
  private readonly aimLines: THREE.LineSegments;
  // Armes du monde (au sol, en vol, tenues par un ennemi) : un seul InstancedMesh.
  private readonly weapons: THREE.InstancedMesh;
  // Arme et mains du joueur, accrochées à la caméra.
  readonly viewModel: ViewModel;
  private readonly bulletHeads: THREE.InstancedMesh;
  private readonly bulletTrails: THREE.InstancedMesh;
  // Éclats de menace (glow) et éclats neutres (décor, joueur) : deux InstancedMesh.
  private readonly threatShards: THREE.InstancedMesh;
  private readonly neutralShards: THREE.InstancedMesh;
  private readonly room: RoomDefinition;
  // Objets temporaires réutilisés : zéro allocation par image.
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly s = new THREE.Vector3();
  private readonly p = new THREE.Vector3();
  private readonly axis = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly dir = new THREE.Vector3();
  private readonly euler = new THREE.Euler(0, 0, 0, "YXZ");
  private readonly one = new THREE.Vector3(1, 1, 1);
  private readonly hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  private readonly lineTint = new THREE.Color();
  private readonly colors = {
    threat: new THREE.Color(PALETTE.threat),
    threatHot: new THREE.Color(PALETTE.threatHot),
    world: new THREE.Color(PALETTE.world2),
    ink: new THREE.Color(PALETTE.ink),
  };

  constructor(room: RoomDefinition, aspect: number) {
    this.room = room;
    this.scene.background = new THREE.Color(PALETTE.void);
    this.camera = new THREE.PerspectiveCamera(90, aspect, 0.05, 200);
    this.camera.rotation.order = "YXZ";
    this.scene.add(this.camera);

    // Salle blanche : une lumière d'ambiance forte, claire aussi par en dessous (aucune face dans le gris sombre),
    // et un soleil plus faible qui ne sert qu'aux ombres portées, claires.
    this.scene.add(new THREE.HemisphereLight(0xffffff, LOOK.groundLight, LOOK.ambient));
    // Soleil qui porte des ombres douces sur toute la salle (24 × 16 m).
    const sun = new THREE.DirectionalLight(0xffffff, LOOK.sun);
    sun.position.set(6, 12, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 16;
    sun.shadow.camera.bottom = -16;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 40;
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun);

    const worldMat = worldMaterial(PALETTE.world);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMaterial());
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Boîtes fixes (murs, ascenseur, passerelle) : fusionnées en un seul mesh, un seul appel de dessin.
    // Ni les baies (instanciées plus bas) ni les boîtes cachées (plafond de collision) n'y entrent.
    const skipped = new Set([...room.rackBoxIndices, ...(room.hiddenBoxIndices ?? [])]);
    const fixed: THREE.BufferGeometry[] = [];
    room.boxes.forEach((box, i) => {
      if (skipped.has(i)) return;
      const size = new THREE.Vector3().subVectors(toV3(box.max), toV3(box.min));
      const center = new THREE.Vector3().addVectors(toV3(box.min), toV3(box.max)).multiplyScalar(0.5);
      fixed.push(new THREE.BoxGeometry(size.x, size.y, size.z).translate(center.x, center.y, center.z));
    });
    const walls = new THREE.Mesh(mergeGeometries(fixed), worldMat);
    walls.castShadow = true;
    walls.receiveShadow = true;
    this.scene.add(walls);

    if (room.interior) this.scene.add(buildCeiling(room.interior.halfX, room.interior.halfZ, room.interior.height));

    // Baies : un seul InstancedMesh, une baie explosée est mise à l'échelle 0. La géométrie est à taille réelle
    // (toutes les baies d'une salle ont la même) ; une baie sur deux est tournée d'un demi-tour, pour varier.
    const firstRack = room.boxes[room.rackBoxIndices[0]!]!;
    const rackSize = new THREE.Vector3().subVectors(toV3(firstRack.max), toV3(firstRack.min));
    const rackGeo = rackGeometry({ depth: rackSize.x, height: rackSize.y, width: rackSize.z });
    this.racks = new THREE.InstancedMesh(rackGeo, rackMaterial(), room.rackBoxIndices.length);
    this.racks.castShadow = true;
    this.racks.receiveShadow = true;
    const halfTurn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    room.rackBoxIndices.forEach((boxIndex, i) => {
      const box = room.boxes[boxIndex]!;
      const matrix = new THREE.Matrix4().compose(
        new THREE.Vector3().addVectors(toV3(box.min), toV3(box.max)).multiplyScalar(0.5),
        (i * 7) % 3 === 0 ? halfTurn : new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      );
      this.rackMatrices.push(matrix);
      this.racks.setMatrixAt(i, matrix);
    });
    this.scene.add(this.racks);

    const threatMat = threatMaterial();
    this.bodies = new EnemyBodies(enemyBodyMaterial());
    for (const mesh of this.bodies.meshes) this.scene.add(mesh);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(POOLS.enemies * 6), 3));
    lineGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(POOLS.enemies * 6), 3));
    this.aimLines = new THREE.LineSegments(lineGeo, aimLineMaterial());
    this.aimLines.frustumCulled = false;
    this.scene.add(this.aimLines);

    const inkMat = inkMaterial();
    this.weapons = new THREE.InstancedMesh(pistolGeometry(), inkMat, POOLS.weapons);
    this.weapons.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.weapons.frustumCulled = false;
    this.weapons.castShadow = true;
    this.scene.add(this.weapons);
    this.viewModel = new ViewModel(inkMat);
    this.camera.add(this.viewModel.group);

    const bulletMat = threatBasicMaterial(PALETTE.threatHot);
    this.bulletHeads = new THREE.InstancedMesh(new THREE.SphereGeometry(BULLET_LOOK.headRadius, 8, 6), bulletMat, POOLS.bullets);
    this.bulletHeads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bulletHeads.frustumCulled = false;
    this.scene.add(this.bulletHeads);
    // Traînée : cylindre unitaire le long de +Y, étiré et orienté selon -vitesse.
    const trailGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 6).translate(0, 0.5, 0);
    const trailMat = threatBasicMaterial(PALETTE.threat);
    this.bulletTrails = new THREE.InstancedMesh(trailGeo, trailMat, POOLS.bullets);
    this.bulletTrails.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bulletTrails.frustumCulled = false;
    this.scene.add(this.bulletTrails);

    const shardGeo = new THREE.TetrahedronGeometry(1);
    this.threatShards = new THREE.InstancedMesh(shardGeo, threatMat, SHATTER.capacity);
    const neutralMat = new THREE.MeshStandardNodeMaterial({ roughness: 0.4, flatShading: true });
    this.neutralShards = new THREE.InstancedMesh(shardGeo, neutralMat, SHATTER.capacity);
    for (let i = 0; i < SHATTER.capacity; i++) {
      this.threatShards.setMatrixAt(i, this.hidden);
      this.neutralShards.setMatrixAt(i, this.hidden);
      this.neutralShards.setColorAt(i, this.colors.world);
    }
    for (const mesh of [this.threatShards, this.neutralShards]) {
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      this.scene.add(mesh);
    }
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setFov(fov: number): void {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  // `dtSim` : temps de simulation de l'image, pour les gestes du joueur (recul, coup de poing).
  update(view: WorldView, dtSim = 0): void {
    const cam = view.camera;
    this.camera.position.set(cam.pos.x, cam.pos.y, cam.pos.z);
    this.camera.rotation.y = cam.yaw;
    this.camera.rotation.x = cam.pitch;
    this.viewModel.update(view, dtSim);

    const rackIndices = this.room.rackBoxIndices;
    for (let i = 0; i < rackIndices.length; i++) {
      this.racks.setMatrixAt(i, view.boxEnabled[rackIndices[i]!] ? this.rackMatrices[i]! : this.hidden);
    }
    this.racks.instanceMatrix.needsUpdate = true;

    this.bodies.update(view.enemies);
    const linePos = this.aimLines.geometry.getAttribute("position") as THREE.BufferAttribute;
    const lineColor = this.aimLines.geometry.getAttribute("color") as THREE.BufferAttribute;
    for (let i = 0; i < POOLS.enemies; i++) {
      const e = view.enemies[i]!;
      if (!e.visible || e.state !== "aim") {
        // Trait masqué : ses deux sommets confondus, il ne dessine rien.
        linePos.setXYZ(i * 2, 0, -100, 0);
        linePos.setXYZ(i * 2 + 1, 0, -100, 0);
        continue;
      }
      // Le trait part de la main qui tient l'arme ; il chauffe de threat à threat-hot pendant la visée.
      const hand = this.bodies.pose(i).hand;
      linePos.setXYZ(i * 2, hand.x, hand.y, hand.z);
      linePos.setXYZ(i * 2 + 1, e.aimPoint.x, e.aimPoint.y, e.aimPoint.z);
      this.lineTint.lerpColors(this.colors.threat, this.colors.threatHot, e.stateProgress);
      lineColor.setXYZ(i * 2, this.lineTint.r, this.lineTint.g, this.lineTint.b);
      lineColor.setXYZ(i * 2 + 1, this.lineTint.r, this.lineTint.g, this.lineTint.b);
    }
    linePos.needsUpdate = true;
    lineColor.needsUpdate = true;

    for (let i = 0; i < POOLS.weapons; i++) {
      const w = view.weapons[i]!;
      if (!w.visible || w.heldByPlayer) {
        this.weapons.setMatrixAt(i, this.hidden);
        continue;
      }
      const holder = w.holderId > PLAYER_ID ? w.holderId - 1 : -1;
      if (holder >= 0 && view.enemies[holder]!.visible) {
        // Tenue par un ennemi : dans sa main, dans l'axe de l'avant-bras.
        const pose = this.bodies.pose(holder);
        this.p.set(pose.hand.x, pose.hand.y, pose.hand.z);
        this.euler.set(pose.handPitch - Math.PI / 2, pose.yaw, 0, "YXZ");
      } else {
        this.p.set(w.pos.x, w.pos.y, w.pos.z);
        this.euler.set(w.angle, 0, w.angle * 0.5, "YXZ");
      }
      this.q.setFromEuler(this.euler);
      this.m.compose(this.p, this.q, this.one);
      this.weapons.setMatrixAt(i, this.m);
    }
    this.weapons.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < POOLS.bullets; i++) {
      const b = view.bullets[i]!;
      if (!b.active) {
        this.bulletHeads.setMatrixAt(i, this.hidden);
        this.bulletTrails.setMatrixAt(i, this.hidden);
        continue;
      }
      this.p.set(b.pos.x, b.pos.y, b.pos.z);
      // Tête et traînée s'effacent près de la caméra : une balle qui part de l'œil ne couvre pas l'écran.
      this.s.setScalar(headScale(b.pos, cam.pos));
      this.m.compose(this.p, this.q.identity(), this.s);
      this.bulletHeads.setMatrixAt(i, this.m);
      this.dir.set(-b.vel.x, -b.vel.y, -b.vel.z).normalize();
      this.q.setFromUnitVectors(this.up, this.dir);
      this.s.set(1, trailLength(b.pos, b.vel, b.origin, cam.pos), 1);
      this.m.compose(this.p, this.q, this.s);
      this.bulletTrails.setMatrixAt(i, this.m);
    }
    this.bulletHeads.instanceMatrix.needsUpdate = true;
    this.bulletTrails.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < view.shards.length; i++) {
      const sh = view.shards[i]!;
      if (!sh.active) {
        this.threatShards.setMatrixAt(i, this.hidden);
        this.neutralShards.setMatrixAt(i, this.hidden);
        continue;
      }
      this.p.set(sh.pos.x, sh.pos.y, sh.pos.z);
      this.axis.set(sh.axis.x, sh.axis.y, sh.axis.z);
      this.q.setFromAxisAngle(this.axis, sh.angle);
      this.s.setScalar(sh.size);
      this.m.compose(this.p, this.q, this.s);
      if (sh.kind === 0) {
        this.threatShards.setMatrixAt(i, this.m);
        this.neutralShards.setMatrixAt(i, this.hidden);
      } else {
        this.threatShards.setMatrixAt(i, this.hidden);
        this.neutralShards.setMatrixAt(i, this.m);
        this.neutralShards.setColorAt(i, sh.kind === 1 ? this.colors.world : this.colors.ink);
      }
    }
    this.threatShards.instanceMatrix.needsUpdate = true;
    this.neutralShards.instanceMatrix.needsUpdate = true;
    if (this.neutralShards.instanceColor) this.neutralShards.instanceColor.needsUpdate = true;
  }
}

function toV3(v: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, v.z);
}
