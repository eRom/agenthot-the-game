// Mesure la boucle d'un morceau (spec 7.2) et affiche la constante à recopier dans src/audio/music.ts. Usage :
//   bun scripts/measure-loop.ts <morceau.mp3> <audiomap.json>
// L'audiomap vient de analyze-beatgrid.py (plugin Hyperframes), lancé avec uv (commande dans le plan 3b, tâche 6).
import { barMeasure, parseSilences } from "./loop-measure";

const [audioPath, audiomapPath] = process.argv.slice(2);
if (!audioPath || !audiomapPath) {
  console.error("usage: bun scripts/measure-loop.ts <track.mp3> <audiomap.json>");
  process.exit(1);
}
const probe = Bun.spawnSync(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", audioPath]);
const duration = Number(probe.stdout.toString().trim());
// Mêmes réglages que les mesures du plan 2 : seuil -50 dB, 0,5 s au moins.
const detect = Bun.spawnSync(["ffmpeg", "-hide_banner", "-nostats", "-i", audioPath, "-af", "silencedetect=noise=-50dB:d=0.5", "-f", "null", "-"]);
const silences = parseSilences(detect.stderr.toString(), duration);
const map = await Bun.file(audiomapPath).json();
const measure = barMeasure(map, silences);
const bpm = (60 * map.tempo.beats_per_bar) / measure.barSeconds;
console.info(`duration ${duration.toFixed(3)} s · head silence until ${silences.headSilenceEnd.toFixed(3)} s · tail silence from ${silences.tailSilenceStart.toFixed(3)} s`);
console.info(`tempo ${bpm.toFixed(2)} BPM, ${map.tempo.beats_per_bar} beats per bar · bar ${measure.barSeconds.toFixed(6)} s · first downbeat ${measure.firstDownbeat.toFixed(3)} s`);
console.info(
  `{ firstDownbeat: ${measure.firstDownbeat}, barSeconds: ${measure.barSeconds.toFixed(6)}, tailSilenceStart: ${measure.tailSilenceStart} }`,
);
