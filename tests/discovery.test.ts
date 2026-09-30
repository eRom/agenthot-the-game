import { describe, expect, test } from "bun:test";
import {
  DISCOVERY_LIMITS,
  catalogProblems,
  contentTypeVerdict,
  headProblems,
  indexNowPayload,
  jsonLdProblems,
  jsonLdSitePaths,
  llmsProblems,
  manifestProblems,
  readJsonLd,
  robotsProblems,
  sitemapProblems,
} from "../scripts/discovery";

const SITE = "https://agenthot.erom.cloud/";
const DASH = String.fromCodePoint(0x2014);

// Un graphe complet. `patch` reçoit les quatre nœuds et peut les changer.
function graph(patch: (nodes: Record<string, Record<string, unknown>>) => void = () => undefined): string {
  const nodes: Record<string, Record<string, unknown>> = {
    site: { "@type": "WebSite", "@id": `${SITE}#website`, url: SITE, name: "AGENTHOT" },
    game: {
      "@type": ["VideoGame", "WebApplication"],
      "@id": `${SITE}#game`,
      url: SITE,
      name: "AGENTHOT",
      image: `${SITE}og-v1.jpg`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      trailer: { "@id": `${SITE}#intro` },
    },
    person: { "@type": "Person", "@id": "https://www.romain-ecarnot.com/#person", name: "Romain Ecarnot", sameAs: ["https://github.com/eRom"] },
    video: {
      "@type": "VideoObject",
      "@id": `${SITE}#intro`,
      name: "AGENTHOT, la cinématique",
      thumbnailUrl: `${SITE}og-v1.jpg`,
      uploadDate: "2026-09-30T17:47:00+02:00",
      contentUrl: `${SITE}assets/intro-DiTX2XMp.mp4`,
    },
  };
  patch(nodes);
  return JSON.stringify({ "@context": "https://schema.org", "@graph": Object.values(nodes) });
}

function page(jsonLd = graph(), head = ""): string {
  return `<!doctype html><html lang="fr"><head><title>AGENTHOT ‧ Le temps est ton arme</title>
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="ai-catalog" href="/.well-known/ai-catalog.json" type="application/ai-catalog+json" />
    <link rel="ard" href="/.well-known/ard.json" type="application/json" />
    <link rel="alternate" type="text/markdown" href="/llms.txt" title="LLM Context" />
    <link rel="alternate" type="text/markdown" href="/llms-full.txt" title="LLM Context Full" />
    ${head}<script type="application/ld+json">${jsonLd}</script></head><body></body></html>`;
}

describe("fiche du jeu en JSON-LD", () => {
  test("un graphe complet n'a aucun problème", () => {
    expect(jsonLdProblems(page(), SITE)).toEqual([]);
    expect(readJsonLd(page())).toHaveLength(4);
  });

  test("une page sans JSON-LD, ou avec un JSON cassé, est refusée", () => {
    expect(jsonLdProblems("<html><head></head></html>", SITE)).toEqual(["missing JSON-LD"]);
    expect(jsonLdProblems(page("{ not json"), SITE)).toEqual(["JSON-LD does not parse"]);
  });

  test("chaque type attendu est réclamé quand il manque", () => {
    expect(jsonLdProblems(page(graph((nodes) => delete nodes.video)), SITE)).toEqual(["JSON-LD has no VideoObject"]);
    expect(jsonLdProblems(page(graph((nodes) => delete nodes.person)), SITE)).toEqual(["JSON-LD has no Person"]);
  });

  test("VideoGame seul n'a pas de résultat enrichi chez Google : il doit aussi être une WebApplication", () => {
    expect(jsonLdProblems(page(graph((nodes) => (nodes.game!["@type"] = "VideoGame"))), SITE)).toEqual(["VideoGame is not co-typed with WebApplication"]);
  });

  test("le jeu est gratuit, à l'adresse du site, et n'invente aucune note", () => {
    expect(jsonLdProblems(page(graph((nodes) => (nodes.game!.offers = { price: "4.99" }))), SITE)).toEqual(["VideoGame offers.price is not 0"]);
    expect(jsonLdProblems(page(graph((nodes) => (nodes.game!.url = "https://example.com/"))), SITE)).toEqual([
      `VideoGame url is https://example.com/, expected ${SITE}`,
    ]);
    expect(jsonLdProblems(page(graph((nodes) => (nodes.game!.aggregateRating = { ratingValue: 5 }))), SITE)).toEqual([
      "VideoGame must not declare a rating or a review",
    ]);
  });

  test("la vidéo porte ce que Google exige, et une date avec son fuseau", () => {
    expect(jsonLdProblems(page(graph((nodes) => delete nodes.video!.thumbnailUrl)), SITE)).toEqual(["VideoObject has no thumbnailUrl"]);
    expect(jsonLdProblems(page(graph((nodes) => (nodes.video!.uploadDate = "2026-09-30"))), SITE)).toEqual([
      "VideoObject uploadDate is not an ISO 8601 date with a time zone: 2026-09-30",
    ]);
  });

  test("uploadDate : le fuseau Z et la fraction de seconde passent, une date impossible est refusée", () => {
    expect(jsonLdProblems(page(graph((nodes) => (nodes.video!.uploadDate = "2026-09-30T17:47:00Z"))), SITE)).toEqual([]);
    expect(jsonLdProblems(page(graph((nodes) => (nodes.video!.uploadDate = "2026-09-30T17:47:00.250+02:00"))), SITE)).toEqual([]);
    expect(jsonLdProblems(page(graph((nodes) => (nodes.video!.uploadDate = "2026-99-99T99:99:99+02:00"))), SITE)).toEqual([
      "VideoObject uploadDate is not an ISO 8601 date with a time zone: 2026-99-99T99:99:99+02:00",
    ]);
  });

  test("une adresse relative est refusée : un robot ne la résout pas", () => {
    expect(jsonLdProblems(page(graph((nodes) => (nodes.game!.image = "/og-v1.jpg"))), SITE)).toEqual([
      "JSON-LD image is not an absolute https URL: /og-v1.jpg",
    ]);
  });

  test("aucun tiret cadratin dans un texte du graphe", () => {
    expect(jsonLdProblems(page(graph((nodes) => (nodes.game!.description = `Bouge ${DASH} le temps repart.`))), SITE)).toEqual([
      "JSON-LD description contains an em dash",
    ]);
  });

  test("les fichiers du site cités par le graphe sont relevés une fois, sans les identifiants", () => {
    expect(jsonLdSitePaths(page(), SITE).sort()).toEqual(["assets/intro-DiTX2XMp.mp4", "og-v1.jpg"]);
  });
});

describe("titre et liens de découverte", () => {
  test("la page complète passe ; chaque lien manquant est réclamé", () => {
    expect(headProblems(page())).toEqual([]);
    expect(headProblems(page().replace(/<link rel="ard"[^>]*>/, ""))).toEqual(['missing link: rel="ard" href="/.well-known/ard.json"']);
    expect(headProblems(page().replace(/<link rel="manifest"[^>]*>/, ""))).toEqual(['missing link: rel="manifest" href="/manifest.webmanifest"']);
  });

  test("le second lien alternate, celui de llms-full.txt, est réclamé lui aussi", () => {
    expect(headProblems(page().replace(/<link rel="alternate"[^>]*llms-full\.txt[^>]*>/, ""))).toEqual(['missing link: rel="alternate" href="/llms-full.txt"']);
    expect(headProblems(page().replace(/<link rel="alternate"[^>]*href="\/llms\.txt"[^>]*>/, ""))).toEqual(['missing link: rel="alternate" href="/llms.txt"']);
  });

  test("une page sans titre, ou au titre vide, est refusée ; un attribut sur la balise est toléré", () => {
    expect(headProblems(page().replace(/<title>[^<]*<\/title>/, ""))).toEqual(["missing <title>"]);
    expect(headProblems(page().replace(/<title>[^<]*<\/title>/, "<title>  </title>"))).toEqual(["missing <title>"]);
    expect(headProblems(page().replace(/<title>[^<]*<\/title>/, '<title data-x="1">AGENTHOT</title>'))).toEqual([]);
  });

  test("un titre trop long pour les moteurs est refusé, la limite passe", () => {
    const at = (length: number): string => page().replace(/<title>[^<]*<\/title>/, `<title>${"x".repeat(length)}</title>`);
    expect(headProblems(at(DISCOVERY_LIMITS.pageTitleChars))).toEqual([]);
    expect(headProblems(at(DISCOVERY_LIMITS.pageTitleChars + 1))).toEqual(["<title> has 66 characters (max 65)"]);
  });
});

describe("robots.txt", () => {
  const robots = `User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`;

  test("ouvert à tous, avec le plan du site : rien à dire", () => {
    expect(robotsProblems(robots, SITE)).toEqual([]);
  });

  test("un chemin fermé, une règle générale absente, un plan du site absent ou relatif : signalés", () => {
    expect(robotsProblems(robots.replace("Allow: /\n\nUser-agent: GPTBot", "Disallow: /assets/\n\nUser-agent: GPTBot"), SITE)).toEqual([
      "robots.txt closes a path: Disallow: /assets/",
    ]);
    expect(robotsProblems(robots.replace("User-agent: *", "User-agent: Googlebot"), SITE)).toEqual(["robots.txt has no rule for every robot (User-agent: *)"]);
    expect(robotsProblems(robots.replace(`${SITE}sitemap.xml`, "/sitemap.xml"), SITE)).toEqual([`robots.txt lacks the line: Sitemap: ${SITE}sitemap.xml`]);
  });

  test("« Disallow: » vide n'interdit rien", () => {
    expect(robotsProblems(`${robots}User-agent: Bingbot\nDisallow:\n`, SITE)).toEqual([]);
  });
});

describe("sitemap.xml", () => {
  const sitemap = (body: string): string => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
  const url = `<url><loc>${SITE}</loc><lastmod>2026-09-30</lastmod></url>`;

  test("l'adresse du jeu et sa date : rien à dire", () => {
    expect(sitemapProblems(sitemap(url), SITE)).toEqual([]);
  });

  test("adresse du jeu absente, autre site, date absente ou illisible : signalés", () => {
    expect(sitemapProblems(sitemap(""), SITE)).toEqual([`sitemap.xml does not list ${SITE}`]);
    expect(sitemapProblems(sitemap(`${url}<url><loc>https://example.com/</loc><lastmod>2026-09-30</lastmod></url>`), SITE)).toEqual([
      "sitemap.xml lists another site: https://example.com/",
    ]);
    expect(sitemapProblems(sitemap(`<url><loc>${SITE}</loc></url>`), SITE)).toEqual(["sitemap.xml: every <url> needs a <lastmod>"]);
    expect(sitemapProblems(sitemap(url.replace("2026-09-30", "30/09/2026")), SITE)).toEqual(["sitemap.xml lastmod is not a date: 30/09/2026"]);
  });

  test("changefreq et priority, ignorés par les moteurs, sont refusés", () => {
    expect(sitemapProblems(sitemap(url.replace("</url>", "<priority>1.0</priority></url>")), SITE)).toEqual([
      "sitemap.xml declares changefreq or priority, which search engines ignore",
    ]);
  });
});

describe("llms.txt", () => {
  const llms = `# AGENTHOT\n\n> Un FPS où le temps n'avance que quand tu bouges.\n\n- [Jouer](${SITE})\n`;

  test("un titre, un résumé, l'adresse du jeu : rien à dire", () => {
    expect(llmsProblems(llms, SITE, "llms.txt")).toEqual([]);
  });

  test("sans titre, sans résumé, sans adresse, avec un tiret cadratin : signalés", () => {
    expect(llmsProblems(llms.replace("# AGENTHOT", "AGENTHOT"), SITE, "llms.txt")).toEqual(['llms.txt does not start with a "# " title']);
    expect(llmsProblems(llms.replace("> Un", "Un"), SITE, "llms.txt")).toEqual(['llms.txt has no "> " summary']);
    expect(llmsProblems(llms.replace(`(${SITE})`, "(plus tard)"), SITE, "llms-full.txt")).toEqual(["llms-full.txt never gives the address of the game"]);
    expect(llmsProblems(`${llms}Bouge ${DASH} tire.\n`, SITE, "llms.txt")).toEqual(["llms.txt contains an em dash"]);
  });

  test("une adresse illisible dans le texte est ignorée, sans exception", () => {
    expect(llmsProblems(`${llms}Exemple : https://<host>/x et https://localhost:PORT/a\n`, SITE, "llms.txt")).toEqual([]);
  });

  test("une adresse du site en http, ou sans la barre du domaine, est refusée", () => {
    expect(llmsProblems(`${llms}- http://agenthot.erom.cloud/llms.txt\n`, SITE, "llms.txt")).toEqual([
      "llms.txt has a wrong address for the site: http://agenthot.erom.cloud/llms.txt",
    ]);
  });
});

describe("catalogue pour agents", () => {
  const entry = {
    identifier: "urn:air:erom.cloud:agenthot:game",
    displayName: "AGENTHOT",
    type: "text/html",
    description: "Le jeu.",
    url: SITE,
    representativeQueries: ["jeu FPS gratuit dans le navigateur", "jeu où le temps n'avance que quand on bouge"],
  };
  const catalog = (entries: unknown[]): string => JSON.stringify({ specVersion: "1.0", entries });

  test("une entrée complète : rien à dire", () => {
    expect(catalogProblems(catalog([entry]), "ard.json")).toEqual([]);
  });

  test("JSON cassé, catalogue vide, champ manquant, adresse relative : signalés", () => {
    expect(catalogProblems("{", "ard.json")).toEqual(["ard.json does not parse"]);
    expect(catalogProblems(catalog([]), "ard.json")).toEqual(["ard.json has no entry"]);
    expect(catalogProblems(catalog([{ ...entry, displayName: "" }]), "ard.json")).toEqual([
      "ard.json: entry urn:air:erom.cloud:agenthot:game has no displayName",
    ]);
    expect(catalogProblems(catalog([{ ...entry, url: "/llms.txt" }]), "ard.json")).toEqual([
      "ard.json: entry urn:air:erom.cloud:agenthot:game url is not absolute",
    ]);
  });

  test("entre 2 et 5 requêtes d'exemple par entrée", () => {
    expect(catalogProblems(catalog([{ ...entry, representativeQueries: ["une seule"] }]), "ard.json")).toEqual([
      "ard.json: entry urn:air:erom.cloud:agenthot:game has 1 representativeQueries (2 to 5 expected)",
    ]);
  });
});

describe("manifeste", () => {
  const manifest = {
    name: "AGENTHOT",
    short_name: "AGENTHOT",
    start_url: "/",
    display: "standalone",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };

  test("complet : rien à dire, et les icônes annoncées sont rendues en chemins", () => {
    expect(manifestProblems(JSON.stringify(manifest))).toEqual({ problems: [], icons: ["icon-192.png", "icon-512.png"] });
  });

  test("JSON cassé, champ manquant, icône de 512 px absente : signalés", () => {
    expect(manifestProblems("nope").problems).toEqual(["manifest.webmanifest does not parse"]);
    expect(manifestProblems(JSON.stringify({ ...manifest, start_url: "" })).problems).toEqual(["manifest.webmanifest has no start_url"]);
    expect(manifestProblems(JSON.stringify({ ...manifest, icons: manifest.icons.slice(0, 1) })).problems).toEqual([
      "manifest.webmanifest has no 512x512 icon",
    ]);
  });

  test("une icône sans src est signalée et n'est pas rendue en chemin", () => {
    const icons = [manifest.icons[0], { sizes: "512x512", type: "image/png" }];
    expect(manifestProblems(JSON.stringify({ ...manifest, icons }))).toEqual({
      problems: ["manifest.webmanifest has an icon without src"],
      icons: ["icon-192.png"],
    });
  });
});

describe("IndexNow", () => {
  test("la requête donne l'hôte sans protocole, la clé, son adresse et la page du jeu", () => {
    expect(indexNowPayload(SITE, "agenthot-key")).toEqual({
      host: "agenthot.erom.cloud",
      key: "agenthot-key",
      keyLocation: `${SITE}agenthot-key.txt`,
      urlList: [SITE],
    });
  });
});

describe("type de contenu des fichiers de découverte", () => {
  test("llms.txt : le type attendu passe, le repli text/plain est un avertissement, un autre type est faux", () => {
    expect(contentTypeVerdict("llms.txt", "text/markdown; charset=utf-8")).toBe("ok");
    expect(contentTypeVerdict("llms.txt", "text/plain; charset=utf-8")).toBe("fallback");
    expect(contentTypeVerdict("llms.txt", "text/html")).toBe("wrong");
  });

  test("llms-full.txt a le même repli que llms.txt", () => {
    expect(contentTypeVerdict("llms-full.txt", "text/plain")).toBe("fallback");
  });

  test("ai-catalog.json accepte application/json en repli", () => {
    expect(contentTypeVerdict(".well-known/ai-catalog.json", "application/ai-catalog+json")).toBe("ok");
    expect(contentTypeVerdict(".well-known/ai-catalog.json", "application/json; charset=utf-8")).toBe("fallback");
    expect(contentTypeVerdict(".well-known/ai-catalog.json", "text/html")).toBe("wrong");
  });

  test("un fichier sans repli : un autre type est faux", () => {
    expect(contentTypeVerdict("manifest.webmanifest", "application/manifest+json")).toBe("ok");
    expect(contentTypeVerdict("manifest.webmanifest", "application/json")).toBe("wrong");
  });
});
