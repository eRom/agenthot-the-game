import { type Plugin, defineConfig } from "vite";

// Adresse écrite dans le JSON-LD d'index.html à la place du MP4 de la cinématique. Le fichier réel porte un hash
// (assets/intro-<hash>.mp4), connu seulement au build : ce greffon met la vraie adresse dans la page construite.
const INTRO_PLACEHOLDER = "/assets/intro.mp4";

function introVideoUrl(): Plugin {
  return {
    name: "agenthot-intro-video-url",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        const file = Object.keys(context.bundle ?? {}).find((name) => /^assets\/intro-[\w-]+\.mp4$/.test(name));
        // Un build sans la cinématique livrerait une adresse morte aux moteurs : on échoue plutôt.
        if (!file) throw new Error("intro video not found in the bundle: the JSON-LD contentUrl cannot be resolved");
        if (!html.includes(INTRO_PLACEHOLDER)) throw new Error(`index.html no longer contains ${INTRO_PLACEHOLDER}`);
        return html.replaceAll(INTRO_PLACEHOLDER, `/${file}`);
      },
    },
  };
}

export default defineConfig({ plugins: [introVideoUrl()] });
