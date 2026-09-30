// Contrôles de mise en ligne (spec 4.7 et 9.2) : ce qu'un robot de partage lira dans la page, et ce que le cache
// long exige des fichiers. Logique pure : scripts/check-release.ts la branche au disque et au réseau.

// Adresse publique du jeu (décision de Romain, 2026-09-30). La barre finale compte : og:url et le lien canonique
// doivent être identiques à l'octet près.
export const SITE_URL = "https://agenthot.erom.cloud/";

// Limites les plus strictes relevées le 2026-09-30 dans la documentation des plateformes.
export const SHARE_LIMITS = {
  // WhatsApp : « 80 characters will suffice » (developers.facebook.com/docs/whatsapp/link-previews).
  descriptionChars: 80,
  // X : « max 70 characters » (documentation archivée) ; 60 laisse une marge aux autres.
  titleChars: 60,
  // WhatsApp : image « under 600KB ».
  imageBytes: 600_000,
  // WhatsApp : les balises doivent tenir dans les 300 premiers Ko du HTML.
  headBytes: 300_000,
  // Facebook et LinkedIn : 1200 × 630 (1,91:1), rendu en grand format.
  imageWidth: 1200,
  imageHeight: 630,
  // Un fichier hors de assets/ est revalidé à chaque visite : il doit rester léger.
  uncachedFileBytes: 150_000,
} as const;

export interface ShareTags {
  title: string | null;
  canonical: string | null;
  // Contenu des <meta>, par `property` (Open Graph) ou `name` (Twitter, description).
  meta: Record<string, string>;
  // `rel` → `href` des <link> d'icône.
  icons: Record<string, string>;
}

function attributes(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of tag.matchAll(/([a-zA-Z][\w:-]*)\s*=\s*"([^"]*)"/g)) out[match[1]!.toLowerCase()] = match[2]!;
  return out;
}

// Lit les balises de partage d'une page statique, comme le fait un robot : sans exécuter de script.
export function readShareTags(html: string): ShareTags {
  const tags: ShareTags = { title: null, canonical: null, meta: {}, icons: {} };
  tags.title = /<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? null;
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    const key = attrs.property ?? attrs.name;
    if (key !== undefined && attrs.content !== undefined) tags.meta[key] = attrs.content;
  }
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    if (attrs.rel === undefined || attrs.href === undefined) continue;
    if (attrs.rel === "canonical") tags.canonical = attrs.href;
    if (attrs.rel === "icon" || attrs.rel === "apple-touch-icon") tags.icons[attrs.rel] = attrs.href;
  }
  return tags;
}

const REQUIRED_META = [
  "description",
  "og:type",
  "og:url",
  "og:title",
  "og:description",
  "og:locale",
  "og:image",
  "og:image:type",
  "og:image:width",
  "og:image:height",
  "og:image:alt",
  "twitter:card",
] as const;

// Tiret cadratin : banni de tout texte lu par un tiers (règle de Romain).
const EM_DASH = String.fromCodePoint(0x2014);

// Ce qui empêcherait un aperçu correct du lien. Liste vide : la page est prête à être partagée.
export function shareProblems(html: string, siteUrl: string): string[] {
  const problems: string[] = [];
  const tags = readShareTags(html);
  const meta = tags.meta;
  for (const key of REQUIRED_META) if (!meta[key]) problems.push(`missing meta: ${key}`);
  if (!tags.title) problems.push("missing <title>");
  if (meta["og:url"] && meta["og:url"] !== siteUrl) problems.push(`og:url is ${meta["og:url"]}, expected ${siteUrl}`);
  if (tags.canonical !== siteUrl) problems.push(`canonical is ${tags.canonical}, expected ${siteUrl}`);
  const image = meta["og:image"];
  if (image && !image.startsWith(siteUrl)) problems.push(`og:image is not an absolute URL of the site: ${image}`);
  if (meta["twitter:card"] && meta["twitter:card"] !== "summary_large_image") {
    problems.push(`twitter:card is ${meta["twitter:card"]}, expected summary_large_image`);
  }
  // Les doublons Twitter, s'ils existent, disent la même chose que l'Open Graph.
  for (const key of ["title", "description", "image", "image:alt"]) {
    const twitter = meta[`twitter:${key}`];
    if (twitter !== undefined && twitter !== meta[`og:${key}`]) problems.push(`twitter:${key} differs from og:${key}`);
  }
  if (meta.description && meta.description !== meta["og:description"]) problems.push("description differs from og:description");
  const title = meta["og:title"] ?? "";
  const description = meta["og:description"] ?? "";
  if (title.length > SHARE_LIMITS.titleChars) problems.push(`og:title has ${title.length} characters (max ${SHARE_LIMITS.titleChars})`);
  if (description.length > SHARE_LIMITS.descriptionChars) {
    problems.push(`og:description has ${description.length} characters (max ${SHARE_LIMITS.descriptionChars})`);
  }
  for (const key of ["og:title", "og:description", "og:image:alt"]) {
    if (meta[key]?.includes(EM_DASH)) problems.push(`${key} contains an em dash`);
  }
  // Une vidéo déclarée serait téléchargée et lancée par iMessage, et récupérée par Slack (Apple TN3156).
  if (Object.keys(meta).some((key) => key.startsWith("og:video"))) problems.push("og:video must not be declared");
  if (!tags.icons["apple-touch-icon"]) problems.push("missing link: apple-touch-icon");
  if (!tags.icons.icon) problems.push("missing link: icon");
  const headEnd = html.search(/<\/head>/i);
  const headBytes = new TextEncoder().encode(html.slice(0, Math.max(0, headEnd))).length;
  if (headEnd < 0) problems.push("missing </head>");
  else if (headBytes > SHARE_LIMITS.headBytes) problems.push(`<head> ends after ${headBytes} bytes (max ${SHARE_LIMITS.headBytes})`);
  return problems;
}

// Taille en pixels d'un JPEG, lue dans son en-tête (segment SOF) ; null si ce n'est pas un JPEG lisible.
export function jpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let at = 2;
  while (at + 9 < bytes.length) {
    if (bytes[at] !== 0xff) return null;
    const marker = bytes[at + 1]!;
    const length = (bytes[at + 2]! << 8) | bytes[at + 3]!;
    // SOF0 à SOF15, sauf DHT (C4), JPG (C8) et DAC (CC) : hauteur puis largeur, sur deux octets chacune.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: (bytes[at + 5]! << 8) | bytes[at + 6]!, width: (bytes[at + 7]! << 8) | bytes[at + 8]! };
    }
    at += 2 + length;
  }
  return null;
}

// L'image de partage face à ce que la page annonce et aux limites des plateformes.
export function imageProblems(bytes: Uint8Array, html: string): string[] {
  const problems: string[] = [];
  const meta = readShareTags(html).meta;
  const size = jpegSize(bytes);
  if (!size) return ["share image is not a readable JPEG"];
  if (size.width !== SHARE_LIMITS.imageWidth || size.height !== SHARE_LIMITS.imageHeight) {
    problems.push(`share image is ${size.width}x${size.height}, expected ${SHARE_LIMITS.imageWidth}x${SHARE_LIMITS.imageHeight}`);
  }
  if (String(size.width) !== meta["og:image:width"] || String(size.height) !== meta["og:image:height"]) {
    problems.push(`og:image:width/height announce ${meta["og:image:width"]}x${meta["og:image:height"]}, the file is ${size.width}x${size.height}`);
  }
  if (bytes.length > SHARE_LIMITS.imageBytes) problems.push(`share image weighs ${bytes.length} bytes (max ${SHARE_LIMITS.imageBytes})`);
  return problems;
}

export interface BuiltFile {
  // Chemin relatif à la racine du site, sans barre initiale : « assets/menu-CjAL0G59.mp3 ».
  path: string;
  bytes: number;
}

// Nom produit par Vite : « nom-<8 caractères de hash>.ext ».
const HASHED_NAME = /-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/;

// Le cache long (un an, immuable) ne vaut que pour assets/ : tout y porte un hash, et rien de lourd ne vit ailleurs.
export function cacheProblems(files: readonly BuiltFile[]): string[] {
  const problems: string[] = [];
  for (const file of files) {
    if (file.path.startsWith("assets/")) {
      if (!HASHED_NAME.test(file.path)) problems.push(`no hash in the name, yet cached for a year: ${file.path}`);
    } else if (file.bytes > SHARE_LIMITS.uncachedFileBytes) {
      problems.push(`${file.bytes} bytes outside assets/, fetched again at every visit: ${file.path}`);
    }
  }
  return problems;
}

// Chemins « /assets/… » cités dans une page ou un script, sans doublon.
export function assetPaths(text: string): string[] {
  return [...new Set([...text.matchAll(/\/assets\/[A-Za-z0-9_.-]+/g)].map((match) => match[0]))];
}

// En-tête attendu sur tout fichier de assets/ (vercel.json).
export function isLongCache(cacheControl: string | null): boolean {
  const value = cacheControl ?? "";
  return /(^|[,\s])immutable($|[,\s])/.test(value) && /max-age=31536000\b/.test(value);
}
