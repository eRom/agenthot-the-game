// Échecs du démarrage et délai maximal du moteur : ce que le chargeur dit au joueur selon ce qui a cassé.

// Un moteur qui ne s'initialise jamais (aucun rendu, GPU bloqué) ne doit pas laisser « Chargement » à l'infini.
export const ENGINE_TIMEOUT_MS = 12_000;

// Quoi a cassé : le code du jeu ne s'est pas chargé (réseau), le rendu est impossible, ou le moteur ne répond pas.
export type BootFailureKind = "load" | "render" | "timeout";

const MESSAGES: Record<BootFailureKind, string> = {
  load: "Le jeu n'a pas pu se charger. Recharge la page.",
  render: "Ton navigateur ne peut pas afficher le jeu : WebGL2 est nécessaire.",
  timeout: "Le jeu met trop de temps à démarrer. Recharge la page.",
};

export class BootError extends Error {
  readonly kind: BootFailureKind;

  constructor(kind: BootFailureKind, cause: unknown) {
    super(`boot failed: ${kind}`, { cause });
    this.kind = kind;
  }
}

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`timed out after ${ms} ms`);
  }
}

// Message du chargeur pour une erreur de démarrage ; toute autre erreur (avant le moteur) dit « pas pu se charger ».
export function bootFailureMessage(error: unknown): string {
  return MESSAGES[error instanceof BootError ? error.kind : "load"];
}

// `promise`, ou un rejet par TimeoutError au bout de `ms`. Le rejet d'origine passe tel quel.
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
