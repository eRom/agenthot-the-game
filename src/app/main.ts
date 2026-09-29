// Point d'entrée de la phase « gris » : une salle, sans menu. Machine d'états réduite.
import "./style.css";
import { ReplayPlayer } from "../replay/player";
import { ReplayRecorder } from "../replay/recorder";
import { createRenderer } from "../render/create-renderer";
import { PostPipeline } from "../render/post";
import { WorldRenderer } from "../render/world-renderer";
import { room01 } from "../rooms/room-01-datacenter";
import { Game, type PlayerInput, emptyInput } from "../sim/game";
import { createWorldView, writeGameView } from "../sim/view";
import { Hud } from "./hud";
import { InputController } from "./input";

type Mode = "start" | "playing" | "paused" | "dead" | "replay" | "won";

// Après la mort, on ignore R et le clic pendant 0,3 s réelle : un clic de tir en rafale ne doit pas sauter l'écran.
const DEAD_INPUT_GUARD_MS = 300;

const params = new URLSearchParams(window.location.search);
const debug = params.has("debug");

const app = document.querySelector<HTMLElement>("#app")!;
const { renderer, isWebGPU } = await createRenderer(app, params.get("renderer") === "webgl");
const world = new WorldRenderer(room01, window.innerWidth / window.innerHeight);
const post = new PostPipeline(renderer, world.scene, world.camera);
const game = new Game(room01);
const view = createWorldView(room01.boxes.length, game.shatter.shards);
const recorder = new ReplayRecorder();
const replay = new ReplayPlayer(recorder, room01);
const input = new InputController(renderer.domElement);
const hud = new Hud(document.querySelector<HTMLElement>("#hud")!, debug);

let mode: Mode = "start";
let last = performance.now();
let restartPending = false;
let deadSince = 0;
let fpsFrames = 0;
let fpsTime = 0;
let fps = 0;

function startRun(): void {
  game.reset();
  recorder.reset();
  writeGameView(game, view);
  recorder.capture(game.simTime, view, true);
  input.clear();
  hud.resetCrosshair();
}

function setMode(next: Mode): void {
  mode = next;
  if (next === "dead") deadSince = performance.now();
  // Écrans de fin : on oublie les appuis du jeu (saut, R, clic de tir) pour ne pas sauter l'écran.
  if (next === "dead" || next === "replay" || next === "won") input.clear();
  hud.show(next === "playing" ? "none" : next);
  // Aberration chromatique : seulement pendant l'écran de mort (spec 6.2).
  post.setDeath(next === "dead" ? 1 : 0);
}

// Un clic reprend le verrou du pointeur sur tous les écrans (Échap ou alt-tab l'ont peut-être perdu).
// Sans verrou, les clics de tir ne sont jamais enregistrés : ce clic ne relance donc pas une partie.
renderer.domElement.addEventListener("click", () => {
  if (mode !== "playing" && !input.locked) input.lock();
});
document.addEventListener("pointerlockchange", () => {
  if (input.locked && (mode === "start" || mode === "paused")) {
    if (mode === "start") startRun();
    input.clear();
    setMode("playing");
  } else if (!input.locked && mode === "playing") {
    setMode("paused");
  }
});
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  world.resize(window.innerWidth / window.innerHeight);
});

writeGameView(game, view);
world.update(view);
setMode("start");

// Sonde de vérification, en debug seulement : fait avancer la partie sans pointer lock (captures, AC-8).
if (debug) {
  (window as unknown as { agenthot: unknown }).agenthot = {
    renderer,
    game,
    post,
    advance(seconds: number, overrides: Partial<PlayerInput> = {}): void {
      const frameInput = { ...emptyInput(), ...overrides };
      for (let t = 0; t < seconds; t += 1 / 60) {
        game.step(1 / 60, frameInput);
        frameInput.fire = false;
        frameInput.throw = false;
      }
      writeGameView(game, view);
      world.update(view);
      // Le rendu reste celui de la boucle : ses appels de dessin se lisent dans le panneau debug.
    },
  };
}

renderer.setAnimationLoop(() => {
  const now = performance.now();
  // Plafond de 0,1 s : un onglet en arrière-plan ne doit pas faire un bond dans le temps.
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  // Sonde AC-6 : mesurée de l'appui (R ou clic) à l'image qui suit la relance, quand la précédente est rendue.
  if (restartPending) {
    if (debug) console.info(`[agenthot] restart ${(performance.now() - input.lastRestartInputTime).toFixed(1)} ms`);
    restartPending = false;
  }

  if (mode === "playing") {
    game.step(dt, input.sample());
    writeGameView(game, view);
    recorder.recordEvents(game.events);
    recorder.capture(game.simTime, view, game.status !== "playing");
    hud.updateCrosshair(view.playerCooldown, view.playerAmmo);
    world.update(view);
    if (game.status === "dead") setMode("dead");
    if (game.status === "won") {
      // Preuve AC-7 : la durée rejouée doit coller au temps de simulation écoulé.
      if (debug) console.info(`[agenthot] replay sim ${game.simTime.toFixed(2)} s vs duration ${replay.duration.toFixed(2)} s`);
      replay.restart();
      setMode("replay");
    }
  } else if (mode === "dead" || mode === "won") {
    // Mort : R ou un clic relance (spec 4.4). Victoire : R seulement, le clic est trop facile à faire par erreur.
    const clicked = input.consumeFire() && mode === "dead";
    const pressedR = input.consumePress("KeyR");
    // Pendant la garde, R et le clic sont écartés (consommés ci-dessus), pas mis en attente.
    const guarded = mode === "dead" && now - deadSince < DEAD_INPUT_GUARD_MS;
    if (!guarded && (pressedR || clicked)) {
      restartPending = true;
      startRun();
      // Sans verrou (Échap sur l'écran de fin), on le redemande et on attend qu'il revienne.
      if (input.locked) setMode("playing");
      else {
        input.lock();
        setMode("paused");
      }
      world.update(view);
    } else if (mode === "won" && input.consumePress("Space")) {
      replay.restart();
      setMode("replay");
    }
  } else if (mode === "replay") {
    replay.update(dt);
    world.update(replay.view);
    hud.chant(replay.playhead);
    if (replay.finished) setMode("won");
  }

  post.render();

  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    fps = fpsFrames / fpsTime;
    fpsFrames = 0;
    fpsTime = 0;
    if (debug) {
      hud.setDebug(
        `${isWebGPU ? "WebGPU" : "WebGL2"} ‧ ${fps.toFixed(0)} fps ‧ ${renderer.info.render.drawCalls} draws ‧ ` +
          `time ${view.timeScale.toFixed(2)} ‧ sim ${game.simTime.toFixed(2)} s`,
      );
    }
  }
});
