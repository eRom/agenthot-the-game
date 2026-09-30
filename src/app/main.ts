// Point d'entrée : léger, sans Three.js. Il affiche le chargeur (ou l'écran mobile) tout de suite, pendant que
// le moteur se charge à part (engine.ts, import dynamique). Parcours : chargement → menu → salle (spec 4).
import "../ui/tokens.css";
import "../ui/screens.css";
import "./style.css";
import { GameAudio } from "../audio/game-audio";
import { ROOMS } from "../rooms/registry";
import { browserStorage, loadSettings, saveSettings } from "../settings/settings";
import { TIME } from "../sim/time";
import { LoaderScreen } from "../ui/loader";
import { MenuScreen } from "../ui/menu";
import { MobileScreen } from "../ui/mobile";
import { type PanelHandle, creditsBody, openPanel, roomsBody, settingsBody } from "../ui/panels";
import { browserEnvironment, playOnDesktopOnly } from "./device";
import type { Engine } from "./engine";

const params = new URLSearchParams(window.location.search);
const screens = document.querySelector<HTMLElement>("#screens")!;

if (playOnDesktopOnly(browserEnvironment())) {
  // Téléphone, tablette, iPad sans Pointer Lock : aucun moteur, aucune musique (spec 4.6).
  new MobileScreen(screens);
} else {
  void boot();
}

async function boot(): Promise<void> {
  const loader = new LoaderScreen(screens);
  void loader.play();
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

  // Polices et boucle du menu (spec 4.1) : la boucle absente (pas encore générée) n'empêche pas d'entrer.
  await loader.waitReady([document.fonts.ready, audio.loadMenuMusic()]);
  // Le moteur (Three.js, 90 % du code, puis l'initialisation du rendu) se charge une fois l'invite affichée,
  // pendant que le joueur la lit : il ne dispute pas le fil principal au chargeur (AC-10).
  const enginePromise = import("./engine").then(({ createEngine }) =>
    createEngine({
      audio,
      settings,
      debug: params.has("debug"),
      forceWebGL: params.get("renderer") === "webgl",
      onSettingsChange: (next) => saveSettings(storage, next),
    }),
  );
  // Rejet traité plus bas, après le geste : on le marque comme attendu dès maintenant.
  enginePromise.catch(() => undefined);
  await loader.waitForGesture(() => audio.unlock());
  loader.busy();
  let engine: Engine;
  try {
    engine = await enginePromise;
  } catch (error) {
    // Ni WebGPU ni WebGL2 : on le dit au lieu d'un écran noir.
    console.error("[agenthot] engine failed", error);
    loader.fail("Ton navigateur ne peut pas afficher le jeu : WebGL2 est nécessaire.");
    return;
  }

  let panel: PanelHandle | null = null;
  const closePanel = (): void => {
    panel?.close();
  };
  // Un panneau ouvert se ferme : son de retour, les entrées reprennent le clavier.
  const onPanelClosed = (): void => {
    panel = null;
    audio.ui("back");
    menu.setPanelOpen(false);
  };
  const showPanel = (title: string, body: HTMLElement): void => {
    menu.setPanelOpen(true);
    panel = openPanel(menu.panelSlot, title, body, onPanelClosed);
  };
  // Jouer : le clic (ou la touche) qui lance la salle est aussi celui qui prend la souris (AC-10).
  const play = (): void => {
    closePanel();
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
      },
    },
  );

  await loader.hide();
  engine.showMenu();
  menu.show();
}
