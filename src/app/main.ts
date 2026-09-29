// Point d'entrée de la phase « gris » : une salle, sans menu. Machine d'états réduite.
import "./style.css";
import { ReplayPlayer } from "../replay/player";
import { ReplayRecorder } from "../replay/recorder";
import { createRenderer } from "../render/create-renderer";
import { WorldRenderer } from "../render/world-renderer";
import { room01 } from "../rooms/room-01-datacenter";
import { Game } from "../sim/game";
import { createWorldView, writeGameView } from "../sim/view";
import { Hud } from "./hud";
import { InputController } from "./input";

type Mode = "start" | "playing" | "paused" | "dead" | "replay" | "won";

const params = new URLSearchParams(window.location.search);
const debug = params.has("debug");

const app = document.querySelector<HTMLElement>("#app")!;
const { renderer, isWebGPU } = await createRenderer(app, params.get("renderer") === "webgl");
const world = new WorldRenderer(room01, window.innerWidth / window.innerHeight);
const game = new Game(room01);
const view = createWorldView(room01.boxes.length, game.shatter.shards);
const recorder = new ReplayRecorder();
const replay = new ReplayPlayer(recorder, room01);
const input = new InputController(renderer.domElement);
const hud = new Hud(document.querySelector<HTMLElement>("#hud")!, debug);

let mode: Mode = "start";
let last = performance.now();
let restartStartedAt = -1;
let fpsFrames = 0;
let fpsTime = 0;
let fps = 0;

function startRun(): void {
  game.reset();
  recorder.reset();
  writeGameView(game, view);
  recorder.capture(game.simTime, view, true);
  input.clear();
}

function setMode(next: Mode): void {
  mode = next;
  hud.show(next === "playing" ? "none" : next);
}

renderer.domElement.addEventListener("click", () => {
  if (mode === "start" || mode === "paused") input.lock();
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

renderer.setAnimationLoop(() => {
  const now = performance.now();
  // Plafond de 0,1 s : un onglet en arrière-plan ne doit pas faire un bond dans le temps.
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  if (mode === "playing") {
    game.step(dt, input.sample());
    writeGameView(game, view);
    recorder.recordEvents(game.events);
    recorder.capture(game.simTime, view, game.status !== "playing");
    hud.updateCrosshair(view.playerCooldown);
    world.update(view);
    if (game.status === "dead") setMode("dead");
    if (game.status === "won") {
      replay.restart();
      setMode("replay");
    }
  } else if (mode === "dead" || mode === "won") {
    // Mort : R ou un clic relance (spec 4.4). Victoire : R seulement, le clic est trop facile à faire par erreur.
    const clicked = input.consumeFire() && mode === "dead";
    if (input.consumePress("KeyR") || clicked) {
      restartStartedAt = now;
      startRun();
      setMode("playing");
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

  renderer.render(world.scene, world.camera);

  if (restartStartedAt >= 0) {
    if (debug) console.info(`[agenthot] restart ${(performance.now() - restartStartedAt).toFixed(1)} ms`);
    restartStartedAt = -1;
  }
  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    fps = fpsFrames / fpsTime;
    fpsFrames = 0;
    fpsTime = 0;
  }
  hud.setDebug(
    `${isWebGPU ? "WebGPU" : "WebGL2"} ‧ ${fps.toFixed(0)} fps ‧ ${renderer.info.render.drawCalls} draws ‧ ` +
      `time ${view.timeScale.toFixed(2)} ‧ sim ${game.simTime.toFixed(2)} s`,
  );
});
