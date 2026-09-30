// Contrôle de mise en ligne (spec 4.7 et 9.2). Usage :
//   bun scripts/check-release.ts dist
//       le site construit, avant tout envoi : balises de partage, image, icônes, noms hachés
//   bun scripts/check-release.ts https://agenthot.erom.cloud/
//       le site en ligne, vu par un robot de partage : les mêmes contrôles, plus les en-têtes de cache,
//       la lecture partielle de la vidéo (206) et la réponse à un fichier absent (404)
// Code 0 si tout passe, 1 sinon. Chaque ligne dit ce qui a été vérifié.
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { type BuiltFile, SITE_URL, assetPaths, cacheProblems, imageProblems, isLongCache, readShareTags, shareProblems } from "./release";

const USAGE = "usage: bun scripts/check-release.ts <dist directory | https://site/>";
// Le robot de Facebook : le plus répandu, et celui dont la documentation donne la chaîne exacte.
const CRAWLER = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
// Type attendu par extension : un type faux, et Safari refuse la vidéo ou la police.
const CONTENT_TYPES: Record<string, string> = {
  js: "javascript",
  css: "text/css",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  webm: "video/webm",
  woff2: "font/woff2",
  webp: "image/webp",
};

let failures = 0;
function report(ok: boolean, label: string, detail = ""): void {
  if (!ok) failures++;
  console.info(`${ok ? "ok  " : "FAIL"} ${label}${detail ? ` (${detail})` : ""}`);
}
function reportProblems(label: string, problems: string[]): void {
  if (problems.length === 0) report(true, label);
  for (const problem of problems) report(false, label, problem);
}

async function listFiles(root: string, dir = ""): Promise<BuiltFile[]> {
  const files: BuiltFile[] = [];
  for (const entry of await readdir(join(root, dir), { withFileTypes: true })) {
    const path = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await listFiles(root, path)));
    else files.push({ path, bytes: (await stat(join(root, path))).size });
  }
  return files;
}

// Chemin local d'une URL du site : « https://agenthot.erom.cloud/og-v1.jpg » → « og-v1.jpg ».
function sitePath(url: string): string {
  return url.startsWith(SITE_URL) ? url.slice(SITE_URL.length) : url.replace(/^\//, "");
}

async function checkDirectory(root: string): Promise<void> {
  const indexFile = Bun.file(join(root, "index.html"));
  if (!(await indexFile.exists())) {
    console.error(`no index.html in ${root}: run "bun run build" first`);
    process.exit(1);
  }
  const html = await indexFile.text();
  reportProblems("share tags", shareProblems(html, SITE_URL));
  const tags = readShareTags(html);
  const imageUrl = tags.meta["og:image"];
  const image = Bun.file(join(root, sitePath(imageUrl ?? "")));
  if (!imageUrl) report(false, "share image", "no og:image to read");
  else if (await image.exists()) reportProblems("share image", imageProblems(new Uint8Array(await image.arrayBuffer()), html));
  else report(false, "share image", `file not found: ${sitePath(imageUrl)}`);
  for (const [rel, href] of Object.entries(tags.icons)) report(await Bun.file(join(root, sitePath(href))).exists(), `icon ${rel}`, href);
  const files = await listFiles(root);
  reportProblems("long cache", cacheProblems(files));
  // Tout fichier cité par la page ou par un script existe dans le site construit.
  const scripts = files.filter((file) => file.path.endsWith(".js"));
  const cited = new Set(assetPaths(html));
  for (const script of scripts) for (const path of assetPaths(await Bun.file(join(root, script.path)).text())) cited.add(path);
  const missing = [...cited].filter((path) => !files.some((file) => `/${file.path}` === path));
  report(missing.length === 0, `${cited.size} cited assets exist`, missing.join(", "));
  const total = files.reduce((sum, file) => sum + file.bytes, 0);
  console.info(`     ${files.length} files, ${(total / 1e6).toFixed(1)} MB`);
}

async function checkSite(base: string): Promise<void> {
  const get = (path: string, headers: Record<string, string> = {}): Promise<Response> =>
    fetch(new URL(path, base), { headers: { "User-Agent": CRAWLER, ...headers }, redirect: "manual" });
  const page = await get("");
  report(page.status === 200 && (page.headers.get("content-type") ?? "").includes("text/html"), "page answers a crawler", `${page.status} ${page.headers.get("content-type")}`);
  const html = await page.text();
  reportProblems("share tags", shareProblems(html, SITE_URL));
  const tags = readShareTags(html);
  // Avant le branchement du domaine, l'image se lit sur l'adresse contrôlée (l'URL annoncée reste celle du domaine).
  const imageUrl = tags.meta["og:image"];
  if (!imageUrl) report(false, "share image", "no og:image to read");
  else {
    const image = await get(sitePath(imageUrl));
    report(image.status === 200 && image.headers.get("content-type") === "image/jpeg", "share image served", `${image.status} ${image.headers.get("content-type")}`);
    reportProblems("share image", imageProblems(new Uint8Array(await image.arrayBuffer()), html));
  }
  for (const [rel, href] of Object.entries(tags.icons)) {
    const icon = await get(sitePath(href));
    report(icon.status === 200 && (icon.headers.get("content-type") ?? "").startsWith("image/"), `icon ${rel}`, `${icon.status} ${icon.headers.get("content-type")}`);
  }
  // Fichiers cités par la page, puis par ses scripts (musiques, vidéos, vignettes).
  const cited = new Set(assetPaths(html));
  for (const path of [...cited].filter((path) => path.endsWith(".js"))) for (const found of assetPaths(await (await get(path)).text())) cited.add(found);
  for (const path of cited) {
    const response = await get(path, { Range: "bytes=0-99" });
    const extension = path.slice(path.lastIndexOf(".") + 1);
    const type = response.headers.get("content-type") ?? "";
    const expected = CONTENT_TYPES[extension];
    const cache = response.headers.get("cache-control");
    // 206 : lecture partielle, que Safari exige pour lire une vidéo. Les autres fichiers peuvent répondre en entier
    // (un script compressé à la volée n'a pas à honorer la plage).
    const partial = response.status === 206 && (response.headers.get("content-range") ?? "").startsWith("bytes 0-99/");
    const served = extension === "mp4" || extension === "webm" ? partial : partial || response.status === 200;
    report(served && isLongCache(cache) && (expected === undefined || type.includes(expected)), path, `${response.status} ${type} ${cache}`);
    await response.arrayBuffer();
  }
  report([...cited].some((path) => path.endsWith(".mp4")) && [...cited].some((path) => path.endsWith(".webm")), "both intro videos are cited");
  // Un fichier absent doit répondre 404 : un repli vers la page (200 text/html) ferait passer un son absent pour présent.
  const absent = await get("assets/missing-00000000.mp3");
  report(absent.status === 404, "missing file answers 404", String(absent.status));
}

const target = process.argv[2];
if (!target) {
  console.error(USAGE);
  process.exit(1);
}
if (/^https?:\/\//.test(target)) await checkSite(target.endsWith("/") ? target : `${target}/`);
else await checkDirectory(target);
console.info(failures === 0 ? "release check: all good" : `release check: ${failures} problem(s)`);
process.exit(failures === 0 ? 0 : 1);
