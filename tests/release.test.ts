import { describe, expect, test } from "bun:test";
import {
  SHARE_LIMITS,
  SITE_URL,
  assetPaths,
  cacheProblems,
  imageProblems,
  isLongCache,
  jpegSize,
  readShareTags,
  shareProblems,
} from "../scripts/release";

// Une page prête à être partagée. `patch` remplace ou retire (null) une balise <meta>, par sa clé.
function page(patch: Record<string, string | null> = {}, extraHead = ""): string {
  const meta: Record<string, string | null> = {
    description: "Un FPS où le temps n'avance que quand tu bouges.",
    "og:type": "website",
    "og:url": SITE_URL,
    "og:title": "AGENTHOT",
    "og:description": "Un FPS où le temps n'avance que quand tu bouges.",
    "og:locale": "fr_FR",
    "og:image": `${SITE_URL}og-v1.jpg`,
    "og:image:type": "image/jpeg",
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:alt": "Un ennemi orange vole en éclats.",
    "twitter:card": "summary_large_image",
    ...patch,
  };
  const lines = Object.entries(meta)
    .filter(([, content]) => content !== null)
    .map(([key, content]) => `<meta ${key.startsWith("og:") ? "property" : "name"}="${key}" content="${content}" />`);
  return `<!doctype html><html lang="fr"><head><meta charset="UTF-8" /><title>AGENTHOT</title>
    <link rel="canonical" href="${SITE_URL}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    ${lines.join("\n    ")}
    ${extraHead}</head><body></body></html>`;
}

// En-tête JPEG minimal : SOI, un segment APP0, puis un SOF0 qui porte la taille.
function jpeg(width: number, height: number, totalBytes = 64): Uint8Array {
  const bytes = new Uint8Array(totalBytes);
  bytes.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08]);
  bytes.set([height >> 8, height & 0xff, width >> 8, width & 0xff], 13);
  return bytes;
}

describe("balises de partage (spec 4.7)", () => {
  test("une page complète n'a aucun problème", () => {
    expect(shareProblems(page(), SITE_URL)).toEqual([]);
  });

  test("les balises se lisent quel que soit l'ordre de leurs attributs", () => {
    const tags = readShareTags(`<head><title> AGENTHOT </title><meta content="website" property="og:type"><link href="${SITE_URL}" rel="canonical"></head>`);
    expect(tags.title).toBe("AGENTHOT");
    expect(tags.meta["og:type"]).toBe("website");
    expect(tags.canonical).toBe(SITE_URL);
  });

  test("chaque balise exigée par une plateforme est réclamée quand elle manque", () => {
    for (const key of ["og:title", "og:type", "og:url", "og:image", "og:description", "og:image:alt", "twitter:card"]) {
      expect(shareProblems(page({ [key]: null }), SITE_URL)).toContain(`missing meta: ${key}`);
    }
  });

  test("une image en chemin relatif ou sur un autre domaine est refusée : les robots veulent une URL absolue du site", () => {
    expect(shareProblems(page({ "og:image": "/og-v1.jpg" }), SITE_URL)).toEqual(["og:image is not an absolute URL of the site: /og-v1.jpg"]);
    expect(shareProblems(page({ "og:image": "http://agenthot.erom.cloud/og-v1.jpg" }), SITE_URL)).toHaveLength(1);
  });

  test("og:url et le lien canonique sont l'adresse du site, barre finale comprise", () => {
    expect(shareProblems(page({ "og:url": "https://agenthot.erom.cloud" }), SITE_URL)).toEqual([
      `og:url is https://agenthot.erom.cloud, expected ${SITE_URL}`,
    ]);
    expect(shareProblems(page().replace(`rel="canonical" href="${SITE_URL}"`, 'rel="canonical" href="https://example.com/"'), SITE_URL)).toEqual([
      `canonical is https://example.com/, expected ${SITE_URL}`,
    ]);
  });

  test("une description trop longue pour WhatsApp est refusée, 80 caractères passent", () => {
    const ok = "x".repeat(SHARE_LIMITS.descriptionChars);
    expect(shareProblems(page({ description: ok, "og:description": ok }), SITE_URL)).toEqual([]);
    const long = `${ok}x`;
    expect(shareProblems(page({ description: long, "og:description": long }), SITE_URL)).toEqual(["og:description has 81 characters (max 80)"]);
  });

  test("la petite carte de X, une description qui diverge, un doublon Twitter différent : refusés", () => {
    expect(shareProblems(page({ "twitter:card": "summary" }), SITE_URL)).toEqual(["twitter:card is summary, expected summary_large_image"]);
    expect(shareProblems(page({ description: "Autre texte." }), SITE_URL)).toEqual(["description differs from og:description"]);
    expect(shareProblems(page({ "twitter:title": "Autre" }), SITE_URL)).toEqual(["twitter:title differs from og:title"]);
  });

  test("aucun tiret cadratin dans un texte lu par un tiers", () => {
    const dash = String.fromCodePoint(0x2014);
    const text = `Bouge ${dash} le temps repart.`;
    expect(shareProblems(page({ description: text, "og:description": text }), SITE_URL)).toEqual(["og:description contains an em dash"]);
  });

  test("une vidéo déclarée est refusée : iMessage la téléchargerait et la lancerait", () => {
    expect(shareProblems(page({ "og:video": `${SITE_URL}intro.mp4` }), SITE_URL)).toEqual(["og:video must not be declared"]);
  });

  test("sans icône, iMessage n'a rien à montrer à côté du titre", () => {
    expect(shareProblems(page().replace(/<link rel="apple-touch-icon"[^>]*>/, ""), SITE_URL)).toEqual(["missing link: apple-touch-icon"]);
  });

  test("des balises repoussées au-delà de 300 Ko sont refusées (WhatsApp ne lit pas plus loin)", () => {
    const padding = `<style>${"a".repeat(SHARE_LIMITS.headBytes)}</style>`;
    expect(shareProblems(page({}, padding), SITE_URL)).toHaveLength(1);
  });
});

describe("image de partage (spec 4.7)", () => {
  test("la taille d'un JPEG se lit dans son en-tête ; un autre fichier est refusé", () => {
    expect(jpegSize(jpeg(1200, 630))).toEqual({ width: 1200, height: 630 });
    expect(jpegSize(new TextEncoder().encode("<!doctype html>"))).toBeNull();
    expect(jpegSize(new Uint8Array(0))).toBeNull();
  });

  test("1200 x 630, annoncée telle quelle, sous la limite de poids : rien à dire", () => {
    expect(imageProblems(jpeg(1200, 630), page())).toEqual([]);
  });

  test("une image d'une autre taille que celle annoncée par la page est signalée", () => {
    expect(imageProblems(jpeg(1200, 600), page())).toHaveLength(2);
    expect(imageProblems(jpeg(1200, 630), page({ "og:image:height": "600" }))).toHaveLength(1);
  });

  test("une image trop lourde pour WhatsApp est signalée ; la page d'erreur d'un hébergeur aussi", () => {
    expect(imageProblems(jpeg(1200, 630, SHARE_LIMITS.imageBytes + 1), page())).toEqual([
      `share image weighs ${SHARE_LIMITS.imageBytes + 1} bytes (max ${SHARE_LIMITS.imageBytes})`,
    ]);
    expect(imageProblems(new TextEncoder().encode("<html>404</html>"), page())).toEqual(["share image is not a readable JPEG"]);
  });
});

describe("cache long (spec 9.2)", () => {
  test("des fichiers hachés dans assets/ et une racine légère : rien à dire", () => {
    expect(
      cacheProblems([
        { path: "index.html", bytes: 2_000 },
        { path: "og-v1.jpg", bytes: 100_492 },
        { path: "fonts/LICENSES.txt", bytes: 13_463 },
        { path: "assets/menu-CjAL0G59.mp3", bytes: 1_542_076 },
        { path: "assets/index-CM23-0fS.css", bytes: 13_390 },
      ]),
    ).toEqual([]);
  });

  test("un fichier lourd resté hors de assets/ est signalé : il serait retéléchargé à chaque visite", () => {
    expect(cacheProblems([{ path: "audio/menu.mp3", bytes: 1_542_076 }])).toEqual([
      "1542076 bytes outside assets/, fetched again at every visit: audio/menu.mp3",
    ]);
  });

  test("un fichier sans hash dans assets/ est signalé : gardé un an, il ne pourrait plus changer", () => {
    expect(cacheProblems([{ path: "assets/menu.mp3", bytes: 10 }])).toEqual(["no hash in the name, yet cached for a year: assets/menu.mp3"]);
  });

  test("les chemins assets/ d'une page ou d'un script sont relevés une seule fois", () => {
    const text = `<script src="/assets/index-aKrfwPH4.js"></script> x="/assets/intro-DiTX2XMp.mp4" y="/assets/index-aKrfwPH4.js"`;
    expect(assetPaths(text)).toEqual(["/assets/index-aKrfwPH4.js", "/assets/intro-DiTX2XMp.mp4"]);
  });

  test("l'en-tête d'un an immuable est reconnu, celui par défaut de l'hébergeur non", () => {
    expect(isLongCache("public, max-age=31536000, immutable")).toBe(true);
    expect(isLongCache("public, max-age=0, must-revalidate")).toBe(false);
    expect(isLongCache("public, max-age=31536000")).toBe(false);
    expect(isLongCache(null)).toBe(false);
  });
});
