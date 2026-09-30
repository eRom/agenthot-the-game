// Moteur du jeu, chargé à part (import dynamique) : Three.js, la simulation, le replay. Le point d'entrée
// (main.ts) affiche le chargeur sans l'attendre (AC-10 : « APPUIE SUR UNE TOUCHE » en 2 s au plus).
import type { GameAudio } from "../audio/game-audio";
import { MENU_DEMO, type MenuCameraPose, menuCamera, menuFade, recordMenuDemo } from "../replay/menu-demo";
import { ReplayPlayer } from "../replay/player";
import { ReplayRecorder } from "../replay/recorder";
import { basePixelRatio, createRenderer } from "../render/create-renderer";
import { PostPipeline } from "../render/post";
import { FrameLimiter, QualityGovernor } from "../render/quality";
import { WorldRenderer } from "../render/world-renderer";
import { room01 } from "../rooms/room-01-datacenter";
import type { Settings } from "../settings/settings";
import { Game, type PlayerInput, emptyInput } from "../sim/game";
import { TIME } from "../sim/time";
import { createWorldView, writeGameView } from "../sim/view";
import { Hud } from "./hud";
import { InputController } from "./input";

export type EngineMode = "idle" | "menu" | "start" | "playing" | "paused" | "dead" | "replay" | "won";

// Après la mort, on ignore R et le clic pendant 0,3 s réelle : un clic de tir en rafale ne doit pas sauter l'écran.
const DEAD_INPUT_GUARD_MS = 300;

export interface EngineOptions {
  audio: GameAudio;
  settings: Settings;
  debug: boolean;
  // `?renderer=webgl` : repli WebGL2 forcé (AC-9).
  forceWebGL: boolean;
  // Réglages changés par la sonde debug : le point d'entrée les enregistre.
  onSettingsChange(settings: Settings): void;
  // Chaque changement d'écran de la salle : le point d'entrée y accroche ses panneaux (pause, victoire).
  onModeChange(mode: EngineMode): void;
}

export interface Engine {
  applySettings(settings: Settings): void;
  // Fond du menu : la démo rejouée à 3 % du temps, caméra qui dérive, musique du menu (spec 4.3).
  showMenu(): void;
  // Affiche la salle, prête à jouer : la souris est demandée tout de suite (à appeler dans le clic ou la touche
  // du joueur, seul moment où le navigateur l'accorde), sinon au premier clic sur la salle.
  enterRoom(): void;
  // Pause : reprendre (dans un clic, pour reprendre la souris), recommencer la salle.
  resume(): void;
  restart(): void;
  // Victoire : revoir le replay.
  rewatch(): void;
}

export async function createEngine(options: EngineOptions): Promise<Engine> {
  const { audio, debug } = options;
  const app = document.querySelector<HTMLElement>("#app")!;
  const { renderer, isWebGPU } = await createRenderer(app, options.forceWebGL);
  const world = new WorldRenderer(room01, window.innerWidth / window.innerHeight);
  const post = new PostPipeline(renderer, world.scene, world.camera);
  const game = new Game(room01);
  const view = createWorldView(room01.boxes.length, game.shatter.shards);
  const recorder = new ReplayRecorder();
  const replay = new ReplayPlayer(recorder, room01);
  const input = new InputController(renderer.domElement);
  // Fond du menu : démo jouée sans écran au démarrage (quelques millisecondes), puis rejouée au ralenti.
  const menuReplay = new ReplayPlayer(recordMenuDemo(room01), room01);
  const menuPose: MenuCameraPose = menuReplay.view.camera;
  let menuTime = 0;
  const hud = new Hud(document.querySelector<HTMLElement>("#hud")!, debug);
  // Qualité auto (spec 9.2) : 60 images par seconde au plus, résolution adaptative, selon le réglage Qualité.
  const quality = new QualityGovernor(options.settings.quality);
  const limiter = new FrameLimiter();
  let settings = options.settings;

  // Applique les paramètres à chaud (spec 4.5) : souris, champ de vision, volumes, qualité.
  function applySettings(next: Settings): void {
    settings = next;
    input.sensitivity = next.sensitivity;
    input.invertY = next.invertY;
    world.setFov(next.fov);
    audio.engine.setVolumes(next.musicVolume / 100, next.sfxVolume / 100);
    if (quality.mode !== next.quality) quality.setMode(next.quality);
    renderer.setPixelRatio(basePixelRatio(isWebGPU) * quality.scale);
  }
  applySettings(settings);

  let mode: EngineMode = "idle";
  let last = performance.now();
  let restartPending = false;
  let deadSince = 0;
  let fpsFrames = 0;
  let fpsTime = 0;
  let fps = 0;

  // Relance (R, clic à la mort, Recommencer) : même salle, sans rien recharger (AC-6).
  function restartRun(): void {
    restartPending = true;
    startRun();
    // Sans verrou (Échap sur l'écran de fin), on le redemande et on attend qu'il revienne.
    if (input.locked) setMode("playing");
    else {
      input.lock();
      setMode("paused");
    }
    world.update(view);
  }

  function rewatch(): void {
    replay.restart();
    audio.playReplayMusic();
    setMode("replay");
  }

  function startRun(): void {
    game.reset();
    recorder.reset();
    writeGameView(game, view);
    recorder.capture(game.simTime, view, true);
    input.clear();
    hud.resetCrosshair();
    audio.playGameMusic();
  }

  function setMode(next: EngineMode): void {
    mode = next;
    if (next === "dead") deadSince = performance.now();
    // Écrans de fin : on oublie les appuis du jeu (saut, R, clic de tir) pour ne pas sauter l'écran.
    if (next === "dead" || next === "replay" || next === "won") input.clear();
    hud.show(next === "playing" || next === "idle" || next === "menu" ? "none" : next);
    // Pas d'arme en main ni de bourdon dans le menu : on y regarde la salle, on n'y joue pas.
    world.viewModel.group.visible = next !== "menu";
    audio.setDrone(next !== "menu");
    // Victoire : la souris est rendue, pour cliquer dans le panneau (Rejouer, Revoir, Menu).
    if (next === "won" && input.locked) document.exitPointerLock();
    options.onModeChange(next);
    // Aberration chromatique : seulement pendant l'écran de mort (spec 6.2).
    post.setDeath(next === "dead" ? 1 : 0);
    post.setFade(0);
  }

  // Un clic reprend le verrou du pointeur sur tous les écrans (Échap ou alt-tab l'ont peut-être perdu).
  // Sans verrou, les clics de tir ne sont jamais enregistrés : ce clic ne relance donc pas une partie.
  renderer.domElement.addEventListener("click", () => {
    audio.unlock();
    // Ni dans le menu, ni à la fin d'une victoire, où la souris sert à cliquer dans les panneaux.
    if (mode !== "idle" && mode !== "menu" && mode !== "playing" && mode !== "won" && !input.locked) input.lock();
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
  setMode("idle");

  // Sonde de vérification, en debug seulement : fait avancer la partie sans pointer lock (captures, AC-8).
  if (debug) {
    (window as unknown as { agenthot: unknown }).agenthot = {
      renderer,
      game,
      post,
      world,
      input,
      // Change des réglages comme le fera le panneau Paramètres : appliqués et enregistrés.
      settings(patch: Partial<Settings>): Settings {
        applySettings({ ...settings, ...patch });
        options.onSettingsChange(settings);
        return settings;
      },
      // Écrans de la salle sans verrou de souris (captures) : « paused », « dead », « won », « replay ».
      forceMode(next: EngineMode): void {
        if (next === "replay") rewatch();
        else setMode(next);
      },

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
    // Rien à montrer tant que la salle n'est pas ouverte : le GPU se repose (chargeur, cinématique).
    if (mode === "idle") return;
    const now = performance.now();
    // Écran plus rapide que la limite : on saute cette image de l'écran, rien n'avance.
    if (!limiter.shouldRender(now, quality.fpsCap)) return;
    if (quality.sample(now - last)) renderer.setPixelRatio(basePixelRatio(isWebGPU) * quality.scale);
    // Plafond de 0,1 s : un onglet en arrière-plan ne doit pas faire un bond dans le temps.
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    // Sonde AC-6 : mesurée de l'appui (R ou clic) à l'image qui suit la relance, quand la précédente est rendue.
    if (restartPending) {
      if (debug) console.info(`[agenthot] restart ${(performance.now() - input.lastRestartInputTime).toFixed(1)} ms`);
      restartPending = false;
    }

    if (mode === "menu") {
      menuTime += dt;
      // Boucle de la démo : au bout de la fenêtre, on repart du début (les éclats et les baies sont rejoués).
      if (menuReplay.finished) menuReplay.restart();
      menuReplay.update(dt * MENU_DEMO.playbackRate);
      menuCamera(menuTime, menuPose);
      post.setFade(menuFade(menuReplay.playhead, menuReplay.duration));
      world.update(menuReplay.view, dt * MENU_DEMO.playbackRate);
    } else if (mode === "playing") {
      const simDt = game.step(dt, input.sample());
      writeGameView(game, view);
      for (let i = 0; i < game.events.count; i++) if (game.events.items[i]!.type === "punch") world.viewModel.punch();
      recorder.recordEvents(game.events);
      recorder.capture(game.simTime, view, game.status !== "playing");
      audio.frame(view, game.events);
      hud.updateCrosshair(view.playerCooldown, view.playerAmmo);
      world.update(view, simDt);
      if (game.status === "dead") setMode("dead");
      if (game.status === "won") {
        // Preuve AC-7 : la durée rejouée doit coller au temps de simulation écoulé.
        if (debug) console.info(`[agenthot] replay sim ${game.simTime.toFixed(2)} s vs duration ${replay.duration.toFixed(2)} s`);
        rewatch();
      }
    } else if (mode === "dead") {
      // Temps figé : le son reste grave et étouffé.
      audio.freeze(TIME.min);
      // Mort : R ou un clic relance (spec 4.4).
      const clicked = input.consumeFire();
      const pressedR = input.consumePress("KeyR");
      // Pendant la garde, R et le clic sont écartés (consommés ci-dessus), pas mis en attente.
      const guarded = now - deadSince < DEAD_INPUT_GUARD_MS;
      if (!guarded && (pressedR || clicked)) restartRun();
    } else if (mode === "replay") {
      replay.update(dt);
      world.update(replay.view, dt);
      audio.frame(replay.view, replay.events);
      hud.chant(replay.playhead);
      if (replay.finished) setMode("won");
    } else {
      // Départ, pause et fin de victoire : la partie est figée, le son aussi.
      audio.freeze(TIME.min);
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
          `${isWebGPU ? "WebGPU" : "WebGL2"} ‧ ${fps.toFixed(0)} fps ‧ res ${quality.scale} ‧ ${renderer.info.render.drawCalls} draws ‧ ` +
            `time ${view.timeScale.toFixed(2)} ‧ sim ${game.simTime.toFixed(2)} s`,
        );
      }
    }
  });

  const engine: Engine = {
    applySettings,
    showMenu(): void {
      if (input.locked) document.exitPointerLock();
      last = performance.now();
      setMode("menu");
      audio.playMenuMusic();
    },
    enterRoom(): void {
      last = performance.now();
      // La salle au départ, vue par le joueur (la caméra sortait de la dérive du menu).
      game.reset();
      writeGameView(game, view);
      world.update(view);
      setMode("start");
      input.lock();
    },
    resume(): void {
      input.lock();
    },
    restart: restartRun,
    rewatch,
  };
  return engine;
}
