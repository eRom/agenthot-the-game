// Fichiers de la cinématique (spec 4.2), fabriqués au plan 3b : WebM AV1, repli MP4 H.264. Importés : Vite leur
// donne un nom haché (cache d'un an chez l'hébergeur). Illisibles, les écrans se passent de vidéo, sans erreur.
import introMp4Url from "./video/intro.mp4";
import introWebmUrl from "./video/intro.webm";

export const INTRO_VIDEO = {
  webm: introWebmUrl,
  mp4: introMp4Url,
} as const;

// Balise <video> de la cinématique. `ambient` : muette, en boucle, lancée seule (écran mobile).
export function introVideoMarkup(className: string, ambient: boolean): string {
  const flags = ambient ? "muted loop autoplay" : "";
  return `<video class="${className}" playsinline preload="auto" ${flags}>
    <source src="${INTRO_VIDEO.webm}" type='video/webm; codecs="av01.0.08M.08"'>
    <source src="${INTRO_VIDEO.mp4}" type="video/mp4">
  </video>`;
}
