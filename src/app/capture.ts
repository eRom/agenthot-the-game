// Enregistrement des séquences de la cinématique (spec 4.2) : le jeu filme son propre canvas et sa propre sortie
// audio (`?record=1` : le replay de victoire ; `?record=menu` : une boucle du fond du menu). Aucun outil externe :
// `canvas.captureStream` + `MediaRecorder`, puis un fichier téléchargé.

export type CaptureTarget = "replay" | "menu";

export const CAPTURE = {
  // Image de référence de la cinématique (spec 4.2) : le canvas est dessiné à cette taille pendant l'enregistrement.
  width: 1920,
  height: 1080,
  fps: 60,
  // Débit du master (ré-encodé ensuite pour le web) : assez haut pour que les éclats restent nets.
  videoBitsPerSecond: 16_000_000,
  audioBitsPerSecond: 192_000,
} as const;

// `?record=1` ou `?record=replay` : le replay ; `?record=menu` : le menu ; sinon rien.
export function captureTarget(params: URLSearchParams): CaptureTarget | null {
  const value = params.get("record");
  if (value === null) return null;
  return value === "menu" ? "menu" : "replay";
}

// Nom du fichier : `agenthot-<cible>-AAAAMMJJ-HHMMSS.<ext>`, en heure locale. L'extension suit le conteneur
// réellement enregistré (Safari n'enregistre que du MP4).
export function captureFileName(target: CaptureTarget, date: Date, mimeType: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `agenthot-${target}-${stamp}.${mimeType.startsWith("video/mp4") ? "mp4" : "webm"}`;
}

// Premier format que le navigateur sait enregistrer : VP9 + Opus d'abord (net pour les éclats), sinon VP8, sinon
// le choix du navigateur (chaîne vide).
export function captureMimeType(isSupported: (type: string) => boolean): string {
  for (const type of ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]) {
    if (isSupported(type)) return type;
  }
  return "";
}

// Taille d'affichage du canvas pendant un enregistrement : l'image 16:9 tient dans la fenêtre sans être déformée.
export function captureDisplaySize(windowWidth: number, windowHeight: number): { width: number; height: number } {
  const scale = Math.min(windowWidth / CAPTURE.width, windowHeight / CAPTURE.height);
  return { width: Math.round(CAPTURE.width * scale), height: Math.round(CAPTURE.height * scale) };
}

export class CanvasCapture {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private readonly canvas: HTMLCanvasElement;
  private readonly audioTrack: MediaStreamTrack | undefined;

  // `audioOut` : la sortie commune du son (le compresseur, avant la destination).
  constructor(canvas: HTMLCanvasElement, ctx: AudioContext, audioOut: AudioNode) {
    this.canvas = canvas;
    const tap = new MediaStreamAudioDestinationNode(ctx);
    audioOut.connect(tap);
    this.audioTrack = tap.stream.getAudioTracks()[0];
  }

  get recording(): boolean {
    return this.recorder !== null;
  }

  start(): void {
    if (this.recorder) return;
    const stream = this.canvas.captureStream(CAPTURE.fps);
    if (this.audioTrack) stream.addTrack(this.audioTrack);
    this.chunks = [];
    this.recorder = new MediaRecorder(stream, {
      mimeType: captureMimeType((type) => MediaRecorder.isTypeSupported(type)),
      videoBitsPerSecond: CAPTURE.videoBitsPerSecond,
      audioBitsPerSecond: CAPTURE.audioBitsPerSecond,
    });
    this.recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    });
    this.recorder.start(1000);
    console.info("[agenthot] capture started");
  }

  // Arrête et télécharge le fichier. Renvoie sa taille (octets), pour la console.
  stop(target: CaptureTarget): Promise<number> {
    const recorder = this.recorder;
    if (!recorder) return Promise.resolve(0);
    this.recorder = null;
    return new Promise((resolve) => {
      recorder.addEventListener(
        "stop",
        () => {
          const blob = new Blob(this.chunks, { type: recorder.mimeType });
          const fileName = captureFileName(target, new Date(), recorder.mimeType);
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          link.click();
          setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
          console.info(`[agenthot] capture saved ${fileName} (${(blob.size / 1e6).toFixed(1)} MB)`);
          resolve(blob.size);
        },
        { once: true },
      );
      recorder.stop();
    });
  }
}
