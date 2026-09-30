// IndexNow : prévient Bing, Yandex, Naver, Seznam et Yep que la page du jeu a changé (Google n'y participe pas).
// Usage :
//   bun scripts/submit-indexnow.ts          montre ce qui serait envoyé, n'envoie rien
//   bun scripts/submit-indexnow.ts --send   envoie (geste visible du dehors : sur le go de Romain seulement)
// La clé est publique : le moteur la relit à /<clé>.txt pour vérifier que l'envoi vient bien du site.
import { INDEXNOW_KEY, indexNowPayload } from "./discovery";
import { SITE_URL } from "./release";

// Un envoi à ce point d'entrée est partagé avec tous les moteurs participants (indexnow.org/faq).
const ENDPOINT = "https://api.indexnow.org/indexnow";

const payload = indexNowPayload(SITE_URL, INDEXNOW_KEY);
console.info(JSON.stringify(payload, null, 2));
if (!process.argv.includes("--send")) {
  console.info("dry run: nothing sent (add --send)");
  process.exit(0);
}
// La clé doit être lisible en ligne avant l'envoi, sinon le moteur refuse la requête.
const keyFile = await fetch(payload.keyLocation);
if (keyFile.status !== 200 || (await keyFile.text()).trim() !== INDEXNOW_KEY) {
  console.error(`key file not served at ${payload.keyLocation} (${keyFile.status}): nothing sent`);
  process.exit(1);
}
const response = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});
// 200 : adresse reçue. 202 : reçue, clé en cours de vérification. Tout autre code est un refus.
console.info(`${ENDPOINT}: ${response.status} ${response.statusText}`);
process.exit(response.status === 200 || response.status === 202 ? 0 : 1);
