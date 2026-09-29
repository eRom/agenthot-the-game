import { describe, expect, test } from "bun:test";
import { ReplayPlayer } from "../src/replay/player";
import { ReplayRecorder } from "../src/replay/recorder";
import { Game } from "../src/sim/game";
import { ENEMY_STATE_CODES, type WorldView, createWorldView } from "../src/sim/view";
import { enemyAt, testRoom } from "./helpers";

// Champs que le replay ne relit pas depuis les échantillons : éclats (rejoués par événements),
// décor (idem) et échelle du temps (le replay se joue à vitesse réelle).
const NOT_SAMPLED = new Set(["shards", "boxEnabled", "timeScale"]);

// Remplit chaque feuille de la vue (nombre, booléen, état) avec une valeur distincte, en parcourant
// l'objet : un champ ajouté plus tard à WorldView est couvert sans toucher à ce test.
function fillEveryField(node: unknown, flag: boolean, counter: { n: number }): void {
  if (Array.isArray(node)) {
    for (const item of node) fillEveryField(item, flag, counter);
    return;
  }
  const obj = node as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (NOT_SAMPLED.has(key)) continue;
    const value = obj[key];
    counter.n++;
    if (key === "state") obj[key] = ENEMY_STATE_CODES[counter.n % ENEMY_STATE_CODES.length];
    // Multiples de 0,25 : exacts en Float32, donc comparables à l'égalité stricte.
    else if (typeof value === "number") obj[key] = (flag ? 1 : -1) * (counter.n * 0.25 + 0.5);
    else if (typeof value === "boolean") obj[key] = flag;
    else if (typeof value === "object" && value !== null) fillEveryField(value, flag, counter);
  }
}

function sampledPart(view: WorldView): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(view)) if (!NOT_SAMPLED.has(key)) out[key] = (view as unknown as Record<string, unknown>)[key];
  return structuredClone(out);
}

describe("replay : aller-retour d'un échantillon", () => {
  // Deux passes (vrai / faux, positif / négatif) : un champ oublié par l'enregistreur garde
  // sa valeur par défaut, qui ne peut pas coïncider avec les deux passes à la fois.
  for (const flag of [true, false]) {
    test(`chaque champ de la vue écrit par l'enregistreur est relu à l'identique (passe ${flag ? "A" : "B"})`, () => {
      const game = new Game(testRoom([enemyAt(0, -5)]));
      const view = createWorldView(game.room.boxes.length, game.shatter.shards);
      fillEveryField(view, flag, { n: 0 });
      const expected = sampledPart(view);
      const recorder = new ReplayRecorder();
      recorder.capture(0, view, true);
      recorder.capture(1 / 60, view, true);
      const replay = new ReplayPlayer(recorder, game.room);
      expect(sampledPart(replay.view)).toEqual(expected);
    });
  }
});
