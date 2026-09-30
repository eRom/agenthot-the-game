#!/bin/zsh
# Image de partage (spec 4.7) : capture scripts/og/og.html à 1200 × 630 avec Chrome sans écran, puis JPEG de moins
# de 300 Ko (limite la plus stricte des plateformes, brief plan 3 section 7).
# Usage : zsh scripts/build-og.sh <fond relatif à scripts/og/> <sortie.jpg>
#   ex. : zsh scripts/build-og.sh ../../assets/images/og-background.png public/og-v1.jpg
set -euo pipefail
ROOT=${0:A:h:h}
BG=${1:?background path, relative to scripts/og/}
OUT=${2:?output jpg}
# Un fond introuvable donnerait une image vide sans erreur : on refuse.
[[ -f "$ROOT/scripts/og/$BG" ]] || { echo "background not found: scripts/og/$BG" >&2; exit 1; }
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
WORK=$(mktemp -d)
# La page pose le fond en « cover » (2:1 recadré en 1200 × 630) et le texte par-dessus.
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 \
  --virtual-time-budget=3000 --screenshot="$WORK/og.png" "file://$ROOT/scripts/og/og.html?bg=$BG" 2>/dev/null
# Qualité réduite pas à pas jusqu'à passer sous 300 Ko (JPEG, 4:2:0).
for q in 3 4 5 6 8 10; do
  ffmpeg -loglevel error -y -i "$WORK/og.png" -q:v $q -pix_fmt yuvj420p "$ROOT/$OUT"
  size=$(stat -f %z "$ROOT/$OUT")
  (( size < 300000 )) && break
done
ffprobe -v error -show_entries stream=width,height -of csv=p=0 "$ROOT/$OUT"
echo "$OUT: $size bytes (q=$q)"
trash "$WORK"
