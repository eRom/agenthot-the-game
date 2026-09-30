// Contrôles de découverte (moteurs de recherche et agents IA) : ce qu'un robot lit en dehors des balises de partage.
// JSON-LD de la page, robots.txt, sitemap.xml, llms.txt, catalogue pour agents, manifeste. Logique pure :
// scripts/check-release.ts la branche au disque et au réseau.

// Tiret cadratin : banni de tout texte lu par un tiers (règle de Romain).
const EM_DASH = String.fromCodePoint(0x2014);

export const DISCOVERY_LIMITS = {
  // Bing Webmaster Tools avertit au-delà de 70 caractères ; les guides courants visent 60 à 65 (relevé le 2026-09-30).
  pageTitleChars: 65,
  // ARD v0.91 : « representativeQueries SHOULD contain 2-5 examples ».
  minQueries: 2,
  maxQueries: 5,
} as const;

// Fichiers servis à une adresse fixe, que la page ou un autre fichier annonce. Chemins relatifs à la racine du site.
export const DISCOVERY_FILES = [
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "llms-full.txt",
  ".well-known/ai-catalog.json",
  ".well-known/ard.json",
  "manifest.webmanifest",
] as const;

// Type de contenu attendu en ligne pour chacun (réglé dans vercel.json quand l'hébergeur ne le devine pas).
export const DISCOVERY_CONTENT_TYPES: Readonly<Record<(typeof DISCOVERY_FILES)[number], string>> = {
  "robots.txt": "text/plain",
  "sitemap.xml": "xml",
  "llms.txt": "text/markdown",
  "llms-full.txt": "text/markdown",
  ".well-known/ai-catalog.json": "application/ai-catalog+json",
  ".well-known/ard.json": "application/json",
  "manifest.webmanifest": "application/manifest+json",
};

// Type de repli accepté pour trois fichiers : Vercel ne documente pas la surcharge de Content-Type par une règle
// `headers` sur un fichier statique. Sans elle, llms.txt arrive en text/plain et le catalogue en application/json,
// ce que les lecteurs tolèrent : un avertissement, pas un échec.
export const DISCOVERY_FALLBACK_TYPES: Readonly<Partial<Record<(typeof DISCOVERY_FILES)[number], string>>> = {
  "llms.txt": "text/plain",
  "llms-full.txt": "text/plain",
  ".well-known/ai-catalog.json": "application/json",
};

// Verdict sur le type servi d'un fichier de découverte : attendu, repli toléré, ou faux. Comparaison par `includes`
// pour tolérer « ; charset=utf-8 ».
export function contentTypeVerdict(path: (typeof DISCOVERY_FILES)[number], contentType: string): "ok" | "fallback" | "wrong" {
  if (contentType.includes(DISCOVERY_CONTENT_TYPES[path])) return "ok";
  const fallback = DISCOVERY_FALLBACK_TYPES[path];
  return fallback !== undefined && contentType.includes(fallback) ? "fallback" : "wrong";
}

// Clé IndexNow du site : publique par nature, servie à /<clé>.txt (indexnow.org). Envoi : scripts/submit-indexnow.ts.
export const INDEXNOW_KEY = "agenthot-hjjp0jh6j53192gxquqxg84k";

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

// Corps de la requête IndexNow (indexnow.org/documentation) : l'hôte, la clé, où la lire, et les adresses changées.
export function indexNowPayload(siteUrl: string, key: string): IndexNowPayload {
  return { host: new URL(siteUrl).host, key, keyLocation: `${siteUrl}${key}.txt`, urlList: [siteUrl] };
}

// Liens de découverte attendus dans le <head>. Une liste de couples (relation, adresse).
export const DISCOVERY_LINKS: readonly { rel: string; href: string }[] = [
  { rel: "manifest", href: "/manifest.webmanifest" },
  { rel: "ai-catalog", href: "/.well-known/ai-catalog.json" },
  { rel: "ard", href: "/.well-known/ard.json" },
  { rel: "describedby", href: "/llms.txt" },
  { rel: "alternate", href: "/llms-full.txt" },
];

function attributes(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of tag.matchAll(/([a-zA-Z][\w:-]*)\s*=\s*"([^"]*)"/g)) out[match[1]!.toLowerCase()] = match[2]!;
  return out;
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

function isObject(value: Json | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(text: string): JsonObject | null {
  try {
    const value = JSON.parse(text) as Json;
    return isObject(value) ? value : null;
  } catch {
    return null;
  }
}

// Toutes les chaînes d'un JSON, avec le nom de la clé qui les porte.
function strings(value: Json, key = "", out: { key: string; text: string }[] = []): { key: string; text: string }[] {
  if (typeof value === "string") out.push({ key, text: value });
  else if (Array.isArray(value)) for (const item of value) strings(item, key, out);
  else if (isObject(value)) for (const [name, item] of Object.entries(value)) strings(item, name, out);
  return out;
}

// Nœuds du graphe JSON-LD de la page ; null si un bloc ne se lit pas.
export function readJsonLd(html: string): JsonObject[] | null {
  const nodes: JsonObject[] = [];
  for (const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    const block = parseJson(match[1]!);
    if (!block) return null;
    const graph = block["@graph"];
    if (Array.isArray(graph)) for (const node of graph) if (isObject(node)) nodes.push(node);
    if (!Array.isArray(graph)) nodes.push(block);
  }
  return nodes;
}

function types(node: JsonObject): string[] {
  const type = node["@type"];
  if (typeof type === "string") return [type];
  return Array.isArray(type) ? type.filter((item): item is string => typeof item === "string") : [];
}

// Clés dont la valeur est une adresse : elle doit être absolue, un robot ne résout pas un chemin relatif.
const URL_KEYS = new Set(["@id", "url", "image", "thumbnailUrl", "contentUrl", "sameAs"]);

// Adresses du site citées par le JSON-LD, en chemins locaux (« og-v1.jpg », « assets/intro-….mp4 »).
export function jsonLdSitePaths(html: string, siteUrl: string): string[] {
  const paths = new Set<string>();
  for (const node of readJsonLd(html) ?? []) {
    for (const { key, text } of strings(node)) {
      if (!URL_KEYS.has(key) || key === "@id" || !text.startsWith(siteUrl)) continue;
      const path = text.slice(siteUrl.length).split(/[?#]/)[0]!;
      if (path) paths.add(path);
    }
  }
  return [...paths];
}

// Ce qui empêcherait un moteur de lire la fiche du jeu. Liste vide : le JSON-LD est prêt.
export function jsonLdProblems(html: string, siteUrl: string): string[] {
  const nodes = readJsonLd(html);
  if (nodes === null) return ["JSON-LD does not parse"];
  if (nodes.length === 0) return ["missing JSON-LD"];
  const problems: string[] = [];
  const find = (type: string): JsonObject | undefined => nodes.find((node) => types(node).includes(type));
  for (const type of ["VideoGame", "WebSite", "Person", "VideoObject"]) if (!find(type)) problems.push(`JSON-LD has no ${type}`);
  const game = find("VideoGame");
  if (game) {
    // Google : « co-type the VideoGame type with another type » (structured-data/software-app, 2026-09-08).
    if (!types(game).includes("WebApplication")) problems.push("VideoGame is not co-typed with WebApplication");
    if (game.url !== siteUrl) problems.push(`VideoGame url is ${String(game.url)}, expected ${siteUrl}`);
    const offers = game.offers;
    if (!isObject(offers) || String(offers.price) !== "0") problems.push("VideoGame offers.price is not 0");
    // Une note inventée est une donnée structurée trompeuse : le jeu n'a aucun avis.
    if ("aggregateRating" in game || "review" in game) problems.push("VideoGame must not declare a rating or a review");
  }
  const video = find("VideoObject");
  if (video) {
    // Google exige name, thumbnailUrl et uploadDate (structured-data/video, 2026-09-24). contentUrl, c'est nous qui
    // l'exigeons : le MP4 est servi par le site, et sans lui la fiche ne mène à aucune vidéo.
    for (const key of ["name", "thumbnailUrl", "uploadDate", "contentUrl"]) if (!video[key]) problems.push(`VideoObject has no ${key}`);
    const uploaded = typeof video.uploadDate === "string" ? video.uploadDate : "";
    // Fuseau Z ou ±hh:mm, fraction de seconde permise, et une date qui existe.
    const isoWithZone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(uploaded) && !Number.isNaN(Date.parse(uploaded));
    if (uploaded && !isoWithZone) {
      problems.push(`VideoObject uploadDate is not an ISO 8601 date with a time zone: ${uploaded}`);
    }
  }
  for (const node of nodes) {
    for (const { key, text } of strings(node)) {
      if (URL_KEYS.has(key) && !/^https:\/\//.test(text)) problems.push(`JSON-LD ${key} is not an absolute https URL: ${text}`);
      if (text.includes(EM_DASH)) problems.push(`JSON-LD ${key} contains an em dash`);
    }
  }
  return problems;
}

// Titre et liens de découverte du <head>.
export function headProblems(html: string): string[] {
  const problems: string[] = [];
  const title = /<title\b[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? "";
  if (title === "") problems.push("missing <title>");
  if (title.length > DISCOVERY_LIMITS.pageTitleChars) problems.push(`<title> has ${title.length} characters (max ${DISCOVERY_LIMITS.pageTitleChars})`);
  if (title.includes(EM_DASH)) problems.push("<title> contains an em dash");
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => attributes(match[0]));
  for (const { rel, href } of DISCOVERY_LINKS) {
    if (!links.some((link) => link.rel === rel && link.href === href)) problems.push(`missing link: rel="${rel}" href="${href}"`);
  }
  return problems;
}

// robots.txt : tout le monde peut lire le site, et le plan du site est annoncé en adresse absolue.
export function robotsProblems(text: string, siteUrl: string): string[] {
  const problems: string[] = [];
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  if (!lines.some((line) => /^user-agent:\s*\*$/i.test(line))) problems.push("robots.txt has no rule for every robot (User-agent: *)");
  const closed = lines.filter((line) => /^disallow:\s*\S/i.test(line));
  if (closed.length > 0) problems.push(`robots.txt closes a path: ${closed.join(" ; ")}`);
  const sitemap = `Sitemap: ${siteUrl}sitemap.xml`;
  if (!lines.includes(sitemap)) problems.push(`robots.txt lacks the line: ${sitemap}`);
  return problems;
}

// sitemap.xml : l'adresse du jeu, et une date de dernière modification lisible.
export function sitemapProblems(xml: string, siteUrl: string): string[] {
  const problems: string[] = [];
  const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]!);
  if (!locs.includes(siteUrl)) problems.push(`sitemap.xml does not list ${siteUrl}`);
  for (const loc of locs) if (!loc.startsWith(siteUrl)) problems.push(`sitemap.xml lists another site: ${loc}`);
  const dates = [...xml.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map((match) => match[1]!);
  if (dates.length !== locs.length) problems.push("sitemap.xml: every <url> needs a <lastmod>");
  for (const date of dates) if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) problems.push(`sitemap.xml lastmod is not a date: ${date}`);
  // Ignorés par Google et par Bing : les écrire laisse croire qu'ils servent.
  if (/<(changefreq|priority)>/.test(xml)) problems.push("sitemap.xml declares changefreq or priority, which search engines ignore");
  return problems;
}

// llms.txt (llmstxt.org) : un titre, un résumé en citation, des adresses du site justes.
export function llmsProblems(text: string, siteUrl: string, name: string): string[] {
  const problems: string[] = [];
  const lines = text.split(/\r?\n/);
  if (!/^# \S/.test(lines[0] ?? "")) problems.push(`${name} does not start with a "# " title`);
  if (!lines.some((line) => line.startsWith("> "))) problems.push(`${name} has no "> " summary`);
  if (text.includes(EM_DASH)) problems.push(`${name} contains an em dash`);
  if (!text.includes(siteUrl)) problems.push(`${name} never gives the address of the game`);
  const host = new URL(siteUrl).host;
  for (const match of text.matchAll(/https?:\/\/[^\s)>`]+/g)) {
    // Une adresse que `new URL` refuse (« https://<host>/x », « https://localhost:PORT/a ») n'est pas une adresse du site.
    if (!URL.canParse(match[0])) continue;
    if (new URL(match[0]).host === host && !match[0].startsWith(siteUrl)) problems.push(`${name} has a wrong address for the site: ${match[0]}`);
  }
  return problems;
}

// Catalogue pour agents (ai-catalog.io, et son successeur ARD) : des entrées complètes, en adresses absolues.
export function catalogProblems(text: string, name: string): string[] {
  const catalog = parseJson(text);
  if (!catalog) return [`${name} does not parse`];
  const problems: string[] = [];
  const entries = Array.isArray(catalog.entries) ? catalog.entries.filter(isObject) : [];
  if (entries.length === 0) problems.push(`${name} has no entry`);
  for (const entry of entries) {
    const id = String(entry.identifier ?? "?");
    for (const key of ["identifier", "displayName", "type", "url", "description"]) {
      if (typeof entry[key] !== "string" || entry[key] === "") problems.push(`${name}: entry ${id} has no ${key}`);
    }
    if (typeof entry.url === "string" && !/^https:\/\//.test(entry.url)) problems.push(`${name}: entry ${id} url is not absolute`);
    const queries = Array.isArray(entry.representativeQueries) ? entry.representativeQueries : [];
    if (queries.length < DISCOVERY_LIMITS.minQueries || queries.length > DISCOVERY_LIMITS.maxQueries) {
      problems.push(`${name}: entry ${id} has ${queries.length} representativeQueries (${DISCOVERY_LIMITS.minQueries} to ${DISCOVERY_LIMITS.maxQueries} expected)`);
    }
  }
  if (strings(catalog).some(({ text: value }) => value.includes(EM_DASH))) problems.push(`${name} contains an em dash`);
  return problems;
}

// Manifeste : un nom, une adresse de départ, et les icônes de 192 et 512 px qu'il annonce. Rend aussi leurs chemins.
export function manifestProblems(text: string): { problems: string[]; icons: string[] } {
  const manifest = parseJson(text);
  if (!manifest) return { problems: ["manifest.webmanifest does not parse"], icons: [] };
  const problems: string[] = [];
  for (const key of ["name", "short_name", "start_url", "display", "lang"]) {
    if (typeof manifest[key] !== "string" || manifest[key] === "") problems.push(`manifest.webmanifest has no ${key}`);
  }
  const icons = Array.isArray(manifest.icons) ? manifest.icons.filter(isObject) : [];
  for (const size of ["192x192", "512x512"]) {
    if (!icons.some((icon) => icon.sizes === size)) problems.push(`manifest.webmanifest has no ${size} icon`);
  }
  const paths = icons.map((icon) => (typeof icon.src === "string" ? icon.src.replace(/^\//, "") : "")).filter((path) => path !== "");
  if (paths.length < icons.length) problems.push("manifest.webmanifest has an icon without src");
  if (strings(manifest).some(({ text: value }) => value.includes(EM_DASH))) problems.push("manifest.webmanifest contains an em dash");
  return { problems, icons: paths };
}

// Problèmes d'un fichier de découverte, d'après son chemin. Le manifeste rend aussi ses icônes par manifestProblems.
export function discoveryFileProblems(path: (typeof DISCOVERY_FILES)[number], text: string, siteUrl: string): string[] {
  switch (path) {
    case "robots.txt":
      return robotsProblems(text, siteUrl);
    case "sitemap.xml":
      return sitemapProblems(text, siteUrl);
    case "llms.txt":
    case "llms-full.txt":
      return llmsProblems(text, siteUrl, path);
    case ".well-known/ai-catalog.json":
    case ".well-known/ard.json":
      return catalogProblems(text, path);
    case "manifest.webmanifest":
      return manifestProblems(text).problems;
  }
}
