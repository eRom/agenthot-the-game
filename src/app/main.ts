// Point d'entrée : léger, sans Three.js. Il affiche le chargeur (ou l'écran mobile) tout de suite, pendant que
// le moteur se charge à part (engine.ts, import dynamique). Parcours : chargement → cinématique (première visite)
// → menu → salle (spec 4).
import "../ui/tokens.css";
import "../ui/screens.css";
import "./style.css";
import { GameAudio } from "../audio/game-audio";
import { ROOMS } from "../rooms/registry";
import { browserStorage, loadSettings, markIntroSeen, readIntroSeen, saveSettings } from "../settings/settings";
import { TIME } from "../sim/time";
import { IntroScreen } from "../ui/intro";
import { LoaderScreen } from "../ui/loader";
import { MenuScreen } from "../ui/menu";
import { MobileScreen } from "../ui/mobile";
import { type PanelHandle, creditsBody, openPanel, roomsBody, settingsBody } from "../ui/panels";
import { RoomPanels } from "../ui/room-panels";
import { BootError, ENGINE_TIMEOUT_MS, TimeoutError, bootFailureMessage, withTimeout } from "./boot-failure";
import { browserEnvironment, playOnDesktopOnly } from "./device";
import type { Engine, EngineMode, EngineOptions } from "./engine";

// Au plus 1,5 s d'attente des polices : une police bloquée ne doit pas retarder l'invite au-delà d'AC-10.
const FONTS_TIMEOUT_MS = 1500;

const params = new URLSearchParams(window.location.search);
const screens = document.querySelector<HTMLElement>("#screens")!;

if (playOnDesktopOnly(browserEnvironment())) {
  // Téléphone, tablette, iPad sans Pointer Lock : aucun moteur, aucune musique (spec 4.6).
  new MobileScreen(screens);
} else {
  void boot();
}

// Le chargeur d'abord ; toute erreur du démarrage s'y affiche au lieu de laisser « Chargement » à l'infini.
async function boot(): Promise<void> {
  const loader = new LoaderScreen(screens);
  void loader.play();
  try {
    await runBoot(loader);
  } catch (error) {
    console.error("[agenthot] boot failed", error);
    loader.fail(bootFailureMessage(error));
  }
}

// Charge le moteur à part : l'échec du chargement du code (réseau), celui du rendu et un moteur qui ne répond pas
// se distinguent, pour que le joueur sache quoi faire.
async function startEngine(options: EngineOptions): Promise<Engine> {
  let module: typeof import("./engine");
  try {
    module = await import("./engine");
  } catch (error) {
    throw new BootError("load", error);
  }
  try {
    return await withTimeout(module.createEngine(options), ENGINE_TIMEOUT_MS);
  } catch (error) {
    throw new BootError(error instanceof TimeoutError ? "timeout" : "render", error);
  }
}

async function runBoot(loader: LoaderScreen): Promise<void> {
  const storage = browserStorage();
  let settings = loadSettings(storage);
  // Contexte audio créé tout de suite, suspendu jusqu'au premier geste : les musiques se décodent pendant ce temps.
  const audio = new GameAudio();
  audio.engine.setVolumes(settings.musicVolume / 100, settings.sfxVolume / 100);
  // Musiques du jeu et du replay : décodées en arrière-plan, sans retenir le chargeur (0,1 à 1,5 s par morceau,
  // mesuré le 2026-09-29). Une musique demandée avant la fin de son décodage démarre dès qu'elle est prête.
  void audio.loadMusic();
  // Onglet en arrière-plan : la boucle d'animation s'arrête et avec elle le gel du son, qui vit dans cette
  // boucle. On fige les filtres (freeze) puis on suspend tout le contexte, sinon la musique du replay et le
  // bourdon continueraient pendant que l'image est figée. Au retour, le contexte reprend s'il tournait.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) audio.freeze(TIME.min);
    audio.setHidden(document.hidden);
  });
  // Tout geste peut débloquer le son (le navigateur ne l'autorise que dans un clic ou une touche).
  window.addEventListener("keydown", () => audio.unlock());
  window.addEventListener("pointerdown", () => audio.unlock());

  // Première visite : la cinématique se précharge pendant le chargeur (spec 4.1 et 4.2).
  let intro = readIntroSeen(storage) ? null : new IntroScreen(screens);
  // Polices, boucle du menu et début de la cinématique : un fichier absent (pas encore généré) n'empêche pas d'entrer.
  await loader.waitReady([withTimeout(document.fonts.ready, FONTS_TIMEOUT_MS), audio.loadMenuMusic(), ...(intro ? [intro.ready] : [])]);
  // Le moteur (Three.js, 90 % du code, puis l'initialisation du rendu) se charge une fois l'invite affichée,
  // pendant que le joueur la lit : il ne dispute pas le fil principal au chargeur (AC-10).
  const enginePromise = startEngine({
    audio,
    settings,
    debug: params.has("debug"),
    forceWebGL: params.get("renderer") === "webgl",
    onSettingsChange: (next) => saveSettings(storage, next),
    onModeChange: (mode) => onModeChange(mode),
  });
  // Panneaux de la salle, branchés une fois le menu construit (plus bas).
  let onModeChange: (mode: EngineMode) => void = () => undefined;
  // Rejet traité plus bas, après le geste : on le marque comme attendu dès maintenant.
  enginePromise.catch(() => undefined);
  await loader.waitForGesture(() => audio.unlock());
  loader.busy();
  // Le jeu finit de se charger pendant la cinématique ; le chargeur reste dessous si elle se termine avant lui.
  if (intro) {
    // « Vue » seulement si la lecture a réellement démarré (fichier absent ou lecture refusée : elle reste à voir).
    if (await intro.play(settings.musicVolume / 100)) markIntroSeen(storage);
  }
  // Un échec du moteur remonte à boot(), qui le dit au joueur au lieu d'un écran noir.
  const engine = await enginePromise;

  let panel: PanelHandle | null = null;
  const closePanel = (): void => {
    panel?.close();
  };
  // Un panneau ouvert se ferme : son de retour (sauf si c'est une salle lancée depuis lui), les entrées reprennent le clavier.
  let launchingRoom = false;
  const onPanelClosed = (): void => {
    panel = null;
    if (!launchingRoom) audio.ui("back");
    menu.setPanelOpen(false);
  };
  const showPanel = (title: string, body: HTMLElement): void => {
    menu.setPanelOpen(true);
    panel = openPanel(menu.panelSlot, title, body, onPanelClosed);
  };
  // Intro : rejoue la cinématique (spec 4.3), puis revient au menu.
  const replayIntro = async (): Promise<void> => {
    menu.hide();
    engine.sleep();
    audio.stopMusic();
    intro ??= new IntroScreen(screens);
    await intro.play(settings.musicVolume / 100);
    engine.showMenu();
    // Le focus revient sur « Intro », l'entrée qui vient d'être validée, pas sur « Jouer ».
    menu.show("intro");
  };
  // Jouer : le clic (ou la touche) qui lance la salle est aussi celui qui prend la souris (AC-10).
  const play = (): void => {
    // Depuis le panneau Salles, le clic est une validation (« select »), pas un retour. Depuis l'entrée « Jouer »,
    // le menu a déjà joué « select » et aucun panneau n'est ouvert.
    if (panel) {
      audio.ui("select");
      launchingRoom = true;
      closePanel();
      launchingRoom = false;
    }
    menu.hide();
    engine.enterRoom();
  };
  const menu = new MenuScreen(
    screens,
    [
      { action: "play", label: "Jouer" },
      { action: "rooms", label: "Salles", hint: `1 / ${ROOMS.length}` },
      { action: "settings", label: "Paramètres" },
      { action: "credits", label: "Crédits" },
      { action: "intro", label: "Intro" },
    ],
    {
      onSound: (sound) => audio.ui(sound),
      onAction(action) {
        if (action === "play") play();
        else if (action === "rooms") showPanel("Salles", roomsBody(ROOMS, () => play()));
        else if (action === "settings") {
          showPanel(
            "Paramètres",
            settingsBody(settings, (next) => {
              settings = next;
              saveSettings(storage, next);
              engine.applySettings(next);
            }),
          );
        } else if (action === "credits") showPanel("Crédits", creditsBody());
        else if (action === "intro") void replayIntro();
      },
    },
  );

  // Salle : pause et fin de victoire (spec 4.4). Menu : retour au menu, depuis l'un ou l'autre.
  const roomPanels = new RoomPanels(screens);
  const backToMenu = (): void => {
    roomPanels.hide();
    audio.ui("back");
    engine.showMenu();
    menu.show();
  };
  onModeChange = (mode) => {
    if (mode === "paused") {
      roomPanels.show("Pause", "Le temps est figé", [
        { label: "Reprendre", key: "Clic", run: () => engine.resume() },
        { label: "Recommencer", code: "KeyR", key: "R", run: () => engine.restart() },
        { label: "Menu", code: "KeyM", key: "M", run: backToMenu },
      ]);
    } else if (mode === "won") {
      roomPanels.show("Salle nettoyée", "Le temps t'a obéi", [
        { label: "Rejouer", code: "KeyR", key: "R", run: () => engine.restart() },
        { label: "Revoir le replay", code: "Space", key: "Espace", run: () => engine.rewatch() },
        { label: "Menu", code: "KeyM", key: "M", run: backToMenu },
      ]);
    } else {
      roomPanels.hide();
    }
  };

  await loader.hide();
  engine.showMenu();
  menu.show();
}
