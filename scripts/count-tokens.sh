#!/bin/zsh
# Crédits (spec 4.3) : tokens et coût API des sessions du projet, dédoublonnés par message.id.
# Usage : zsh scripts/count-tokens.sh <dossier de transcripts ~/.claude/projects/...> [...]
# Une réponse du modèle est écrite sur plusieurs lignes (une par bloc) avec le même message.id : on n'en garde
# qu'une. Les sous-agents écrivent dans <session>/subagents/ : la recherche est récursive. Les lignes
# « <synthetic> » ne sont pas facturées. Les tokens de réflexion sont déjà dans output_tokens.
set -euo pipefail
command find "$@" -name '*.jsonl' -not -path '*/memory/*' -print0 \
  | xargs -0 cat \
  | jq -r 'select(.type=="assistant" and .message.usage!=null and .message.model!="<synthetic>") | [.message.id, .message.model, .message.usage.input_tokens, (.message.usage.cache_creation.ephemeral_5m_input_tokens // 0), (.message.usage.cache_creation.ephemeral_1h_input_tokens // 0), .message.usage.cache_read_input_tokens, .message.usage.output_tokens] | @tsv' \
  | awk -F'\t' '
    BEGIN {
      # Prix en $ par million de tokens : entrée, cache écrit 5 min, cache écrit 1 h, cache lu, sortie.
      # Source : platform.claude.com/docs/en/about-claude/pricing (lu le 2026-09-30).
      P["claude-opus-5-5"]="4 5 8 0.20 20"
      P["claude-sonnet-5-5"]="2 2.50 4 0.20 10"
      P["claude-fable-5-1"]="10 12.50 20 0.25 50"
      P["claude-haiku-4-5-20251001"]="1 1.25 2 0.10 5"
    }
    { k=$1
      if (!(k in M)) { M[k]=$2; I[k]=$3; C5[k]=$4; C1[k]=$5; R[k]=$6; O[k]=$7 }
      else if ($7 > O[k]) O[k]=$7 }
    END {
      for (k in M) { m=M[k]; n[m]++; i[m]+=I[k]; c5[m]+=C5[k]; c1[m]+=C1[k]; r[m]+=R[k]; o[m]+=O[k] }
      for (m in n) {
        if (!(m in P)) { printf "%s : pas de prix connu (%d messages)\n", m, n[m]; unknown++; continue }
        split(P[m], p, " ")
        cost=(i[m]*p[1] + c5[m]*p[2] + c1[m]*p[3] + r[m]*p[4] + o[m]*p[5]) / 1e6
        tok=i[m]+c5[m]+c1[m]+r[m]+o[m]
        printf "%s msgs=%d in=%d cw5m=%d cw1h=%d cr=%d out=%d total=%d cost=$%.2f\n", m, n[m], i[m], c5[m], c1[m], r[m], o[m], tok, cost
        T+=cost; TT+=tok
      }
      printf "TOTAL tokens=%d cost=$%.2f\n", TT, T
      # Un modèle sans prix fausse le total : on échoue, pour ne pas écrire un coût trop bas dans les crédits.
      if (unknown) exit 3
    }'
