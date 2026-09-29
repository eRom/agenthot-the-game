// Clavier + souris → PlayerInput. `KeyboardEvent.code` suit la position physique des touches :
// KeyW/KeyA/KeyS/KeyD couvrent ZQSD sur un clavier AZERTY.
import { type PlayerInput, emptyInput } from "../sim/game";

// Radians par pixel de souris, à sensibilité 1.
const BASE_SENSITIVITY = 0.0022;

export class InputController {
  sensitivity = 1;
  invertY = false;
  private readonly held = new Set<string>();
  private readonly pressed = new Set<string>();
  private mouseDX = 0;
  private mouseDY = 0;
  private firePressed = false;
  private throwPressed = false;
  private readonly out: PlayerInput = emptyInput();
  private readonly canvas: HTMLElement;

  constructor(canvas: HTMLElement) {
    this.canvas = canvas;
    window.addEventListener("keydown", (e) => {
      if (!this.held.has(e.code)) this.pressed.add(e.code);
      this.held.add(e.code);
    });
    window.addEventListener("keyup", (e) => this.held.delete(e.code));
    window.addEventListener("blur", () => this.held.clear());
    document.addEventListener("mousemove", (e) => {
      if (!this.locked) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });
    document.addEventListener("mousedown", (e) => {
      if (!this.locked) return;
      if (e.button === 0) this.firePressed = true;
      if (e.button === 2) this.throwPressed = true;
    });
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  get locked(): boolean {
    return document.pointerLockElement === this.canvas;
  }

  lock(): void {
    // requestPointerLock renvoie une promesse dans les navigateurs récents : on ignore un refus.
    void Promise.resolve(this.canvas.requestPointerLock()).catch(() => undefined);
  }

  // Vrai une seule fois par appui (R, Espace de menu, etc.).
  consumePress(code: string): boolean {
    const had = this.pressed.has(code);
    this.pressed.delete(code);
    return had;
  }

  // Vrai une seule fois par clic gauche (relance après la mort).
  consumeFire(): boolean {
    const had = this.firePressed;
    this.firePressed = false;
    return had;
  }

  // Échantillonne les commandes de l'image et vide les appuis ponctuels.
  sample(): PlayerInput {
    const o = this.out;
    o.moveZ = (this.held.has("KeyW") ? 1 : 0) - (this.held.has("KeyS") ? 1 : 0);
    o.moveX = (this.held.has("KeyD") ? 1 : 0) - (this.held.has("KeyA") ? 1 : 0);
    const k = BASE_SENSITIVITY * this.sensitivity;
    o.lookDX = this.mouseDX * k;
    o.lookDY = this.mouseDY * k * (this.invertY ? -1 : 1);
    o.lookPixels = Math.abs(this.mouseDX) + Math.abs(this.mouseDY);
    o.jump = this.held.has("Space");
    o.crouch = this.held.has("KeyC") || this.held.has("ControlLeft");
    o.fire = this.firePressed;
    o.throw = this.throwPressed;
    o.use = this.pressed.has("KeyE");
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.firePressed = false;
    this.throwPressed = false;
    this.pressed.delete("KeyE");
    return o;
  }

  // À la reprise : on oublie ce qui a été tapé pendant la pause.
  clear(): void {
    this.pressed.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.firePressed = false;
    this.throwPressed = false;
  }
}
