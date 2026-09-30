// Fichiers de la cinématique (spec 4.2), fabriqués au plan 3b : WebM AV1, repli MP4 H.264.
// Tant qu'ils n'existent pas, les écrans qui les lisent se passent de vidéo, sans erreur.
export const INTRO_VIDEO = {
  webm: "/video/intro.webm",
  mp4: "/video/intro.mp4",
} as const;

// Balise <video> de la cinématique. `ambient` : muette, en boucle, lancée seule (écran mobile).
export function introVideoMarkup(className: string, ambient: boolean): string {
  const flags = ambient ? "muted loop autoplay" : "";
  return `<video class="${className}" playsinline preload="auto" ${flags}>
    <source src="${INTRO_VIDEO.webm}" type='video/webm; codecs="av01.0.08M.08"'>
    <source src="${INTRO_VIDEO.mp4}" type="video/mp4">
  </video>`;
}
