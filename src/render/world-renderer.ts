// Rendu « gris » : dessine une WorldView (jeu ou replay) sans jamais modifier la simulation.
import * as THREE from "three/webgpu";
import type { RoomDefinition } from "../rooms/types";
import { ENEMY, POOLS } from "../sim/entities";
import { SHATTER } from "../sim/shatter";
import type { WorldView } from "../sim/view";
import { BULLET_LOOK, headScale, trailLength } from "./bullet-look";
import { PALETTE } from "./palette";

const MUZZLE_HEIGHT = ENEMY.muzzleHeight;

export class WorldRenderer {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private readonly racks: THREE.InstancedMesh;
  private readonly rackMatrices: THREE.Matrix4[] = [];
  private readonly enemies: THREE.Mesh[] = [];
  private readonly aimLines: THREE.Line[] = [];
  private readonly weapons: THREE.Mesh[] = [];
  private readonly viewModel: THREE.Mesh;
  private readonly bulletHeads: THREE.InstancedMesh;
  private readonly bulletTrails: THREE.InstancedMesh;
  private readonly shards: THREE.InstancedMesh;
  private readonly room: RoomDefinition;
  // Objets temporaires réutilisés : zéro allocation par image.
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly s = new THREE.Vector3();
  private readonly p = new THREE.Vector3();
  private readonly axis = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly dir = new THREE.Vector3();
  private readonly hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  private readonly colors = {
    threat: new THREE.Color(PALETTE.threat),
    world: new THREE.Color(PALETTE.world2),
    ink: new THREE.Color(PALETTE.ink),
  };

  constructor(room: RoomDefinition, aspect: number) {
    this.room = room;
    this.scene.background = new THREE.Color(PALETTE.void);
    this.camera = new THREE.PerspectiveCamera(90, aspect, 0.05, 200);
    this.camera.rotation.order = "YXZ";
    this.scene.add(this.camera);

    this.scene.add(new THREE.HemisphereLight(0xffffff, PALETTE.void2, 1.4));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(6, 12, 4);
    this.scene.add(sun);

    const worldMat = new THREE.MeshStandardMaterial({ color: PALETTE.world, roughness: 0.9 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), worldMat);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // Boîtes fixes (murs, ascenseur, passerelle) : un mesh chacune, elles sont peu nombreuses.
    const rackSet = new Set(room.rackBoxIndices);
    room.boxes.forEach((box, i) => {
      if (rackSet.has(i)) return;
      const size = new THREE.Vector3().subVectors(toV3(box.max), toV3(box.min));
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), worldMat);
      mesh.position.addVectors(toV3(box.min), toV3(box.max)).multiplyScalar(0.5);
      this.scene.add(mesh);
    });

    // Baies : un seul InstancedMesh, une baie explosée est mise à l'échelle 0.
    const rackMat = new THREE.MeshStandardMaterial({ color: PALETTE.world2, roughness: 0.8 });
    this.racks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), rackMat, room.rackBoxIndices.length);
    room.rackBoxIndices.forEach((boxIndex, i) => {
      const box = room.boxes[boxIndex]!;
      const matrix = new THREE.Matrix4().compose(
        new THREE.Vector3().addVectors(toV3(box.min), toV3(box.max)).multiplyScalar(0.5),
        new THREE.Quaternion(),
        new THREE.Vector3().subVectors(toV3(box.max), toV3(box.min)),
      );
      this.rackMatrices.push(matrix);
      this.racks.setMatrixAt(i, matrix);
    });
    this.scene.add(this.racks);

    const threatMat = new THREE.MeshStandardMaterial({
      color: PALETTE.threat,
      emissive: PALETTE.threat,
      emissiveIntensity: 0.25,
      roughness: 0.5,
    });
    const enemyGeo = new THREE.CapsuleGeometry(ENEMY.radius, ENEMY.height - ENEMY.radius * 2, 4, 8);
    const aimMat = new THREE.LineBasicMaterial({ color: PALETTE.threatHot, transparent: true });
    for (let i = 0; i < POOLS.enemies; i++) {
      const mesh = new THREE.Mesh(enemyGeo, threatMat);
      mesh.visible = false;
      this.enemies.push(mesh);
      this.scene.add(mesh);
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(lineGeo, aimMat.clone());
      line.visible = false;
      line.frustumCulled = false;
      this.aimLines.push(line);
      this.scene.add(line);
    }

    const inkMat = new THREE.MeshStandardMaterial({ color: PALETTE.ink, roughness: 0.6 });
    const weaponGeo = new THREE.BoxGeometry(0.08, 0.15, 0.3);
    for (let i = 0; i < POOLS.weapons; i++) {
      const mesh = new THREE.Mesh(weaponGeo, inkMat);
      mesh.visible = false;
      this.weapons.push(mesh);
      this.scene.add(mesh);
    }
    // Arme en main : plus petite et plus loin que les armes du monde, pour ne pas boucher la vue.
    this.viewModel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.24), inkMat);
    this.viewModel.position.set(0.2, -0.2, -0.55);
    this.camera.add(this.viewModel);

    const bulletMat = new THREE.MeshBasicMaterial({ color: PALETTE.threatHot });
    this.bulletHeads = new THREE.InstancedMesh(new THREE.SphereGeometry(BULLET_LOOK.headRadius, 8, 6), bulletMat, POOLS.bullets);
    this.bulletHeads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bulletHeads.frustumCulled = false;
    this.scene.add(this.bulletHeads);
    // Traînée : cylindre unitaire le long de +Y, étiré et orienté selon -vitesse.
    const trailGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 6).translate(0, 0.5, 0);
    const trailMat = new THREE.MeshBasicMaterial({ color: PALETTE.threat, transparent: true, opacity: 0.85 });
    this.bulletTrails = new THREE.InstancedMesh(trailGeo, trailMat, POOLS.bullets);
    this.bulletTrails.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bulletTrails.frustumCulled = false;
    this.scene.add(this.bulletTrails);

    const shardMat = new THREE.MeshStandardMaterial({ roughness: 0.4, flatShading: true });
    this.shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(1), shardMat, SHATTER.capacity);
    this.shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.shards.frustumCulled = false;
    for (let i = 0; i < SHATTER.capacity; i++) this.shards.setColorAt(i, this.colors.threat);
    this.scene.add(this.shards);
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setFov(fov: number): void {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  update(view: WorldView): void {
    const cam = view.camera;
    this.camera.position.set(cam.pos.x, cam.pos.y, cam.pos.z);
    this.camera.rotation.y = cam.yaw;
    this.camera.rotation.x = cam.pitch;
    this.viewModel.visible = view.playerAmmo >= 0;

    const rackIndices = this.room.rackBoxIndices;
    for (let i = 0; i < rackIndices.length; i++) {
      this.racks.setMatrixAt(i, view.boxEnabled[rackIndices[i]!] ? this.rackMatrices[i]! : this.hidden);
    }
    this.racks.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < POOLS.enemies; i++) {
      const e = view.enemies[i]!;
      const mesh = this.enemies[i]!;
      const line = this.aimLines[i]!;
      mesh.visible = e.visible;
      line.visible = e.visible && e.state === "aim";
      if (!e.visible) continue;
      mesh.position.set(e.pos.x, e.pos.y + ENEMY.height / 2, e.pos.z);
      mesh.rotation.y = e.yaw;
      // Vacillement : l'ennemi penche en arrière.
      mesh.rotation.x = e.state === "stagger" ? 0.35 : 0;
      if (line.visible) {
        const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
        attr.setXYZ(0, e.pos.x, e.pos.y + MUZZLE_HEIGHT, e.pos.z);
        attr.setXYZ(1, e.aimPoint.x, e.aimPoint.y, e.aimPoint.z);
        attr.needsUpdate = true;
        (line.material as THREE.LineBasicMaterial).opacity = 0.25 + 0.75 * e.stateProgress;
      }
    }

    for (let i = 0; i < POOLS.weapons; i++) {
      const w = view.weapons[i]!;
      const mesh = this.weapons[i]!;
      mesh.visible = w.visible && !w.heldByPlayer;
      if (!mesh.visible) continue;
      mesh.position.set(w.pos.x, w.pos.y, w.pos.z);
      mesh.rotation.set(w.angle, 0, w.angle * 0.5);
    }

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
        this.shards.setMatrixAt(i, this.hidden);
        continue;
      }
      this.p.set(sh.pos.x, sh.pos.y, sh.pos.z);
      this.axis.set(sh.axis.x, sh.axis.y, sh.axis.z);
      this.q.setFromAxisAngle(this.axis, sh.angle);
      this.s.setScalar(sh.size);
      this.m.compose(this.p, this.q, this.s);
      this.shards.setMatrixAt(i, this.m);
      this.shards.setColorAt(i, sh.kind === 0 ? this.colors.threat : sh.kind === 1 ? this.colors.world : this.colors.ink);
    }
    this.shards.instanceMatrix.needsUpdate = true;
    if (this.shards.instanceColor) this.shards.instanceColor.needsUpdate = true;
  }
}

function toV3(v: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, v.z);
}
