// Journal des dépenses (spec 8, AC-17). Usage :
//   bun scripts/spend.ts summary
//       total par outil face au budget de la spec ; code 1 si un outil dépasse
//   bun scripts/spend.ts check <lyria|seedream|nanobanana> <coût $> [<plafond $>]
//       avant un appel payant : code 0 s'il passe, code 2 sinon (demander à Romain)
//   bun scripts/spend.ts log-nanobanana <512px|1K|2K|4K> <image> <fichier du prompt>
//       juste après un appel Nano Banana (MCP erom-image, qui ne renvoie pas le coût) : ajoute sa ligne au journal
import { appendFile } from "node:fs/promises";
import { checkSpend, ledgerSummary, nanoBananaEntry, parseSpendArgs } from "./ledger";
import { LEDGER_PATH } from "./lyria";

const USAGE = "usage: bun scripts/spend.ts summary | check <tool> <costUsd> [<capUsd>] | log-nanobanana <resolution> <image> <promptFile>";

const args = parseSpendArgs(process.argv.slice(2));
if (!args.ok) {
  console.error(`${args.error}\n${USAGE}`);
  process.exit(1);
}
const ledgerFile = Bun.file(LEDGER_PATH);
// Un journal introuvable n'est jamais « 0 $ dépensés » (cwd hors de la racine du dépôt) : on refuse.
if (!(await ledgerFile.exists())) {
  console.error(`ledger not found: ${LEDGER_PATH} (run from the repository root)`);
  process.exit(1);
}
const ledgerText = await ledgerFile.text();
const command = args.command;

if (command.kind === "summary") {
  let over = false;
  for (const row of ledgerSummary(ledgerText)) {
    const budget = row.budgetUsd === null ? "no budget in spec 8" : `${row.budgetUsd.toFixed(2)} $`;
    const status = row.budgetUsd === null ? "CHECK" : row.spentUsd <= row.budgetUsd + 1e-9 ? "ok" : "OVER";
    if (status !== "ok") over = true;
    console.info(`${row.tool.padEnd(11)} ${String(row.calls).padStart(3)} calls  ${row.spentUsd.toFixed(3)} $ / ${budget}  ${status}`);
  }
  process.exit(over ? 1 : 0);
} else if (command.kind === "check") {
  const result = checkSpend(ledgerText, command.tool, command.costUsd, command.capUsd);
  const line = `${command.tool}: ${result.spentUsd.toFixed(3)} $ spent + ${command.costUsd} $ ${result.ok ? "<=" : ">"} ${result.limitUsd.toFixed(3)} $`;
  if (result.ok) console.info(`${line}: ok`);
  else console.error(`${line}: STOP, ask Romain for a new go.`);
  process.exit(result.ok ? 0 : 2);
} else {
  const promptFile = Bun.file(command.promptFile);
  if (!(await promptFile.exists())) {
    console.error(`prompt file not found: ${command.promptFile}`);
    process.exit(1);
  }
  const prompt = (await promptFile.text()).trim();
  // L'appel a déjà eu lieu : la ligne s'écrit même si l'image manque (il est peut-être facturé), avec un avertissement.
  if (!(await Bun.file(command.output).exists())) console.warn(`WARNING: ${command.output} does not exist; the line is logged anyway.`);
  const entry = nanoBananaEntry(new Date(), command.resolution, command.output, prompt);
  await appendFile(LEDGER_PATH, `${JSON.stringify(entry)}\n`);
  console.info(`logged nanobanana ${command.resolution} ${entry.costUsd} $ -> ${command.output}`);
}
