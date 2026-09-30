#!/bin/zsh
# Polices de l'interface (spec 3 et 6.3), auto-hébergées en woff2 : sous-ensemble latin + français.
# Sources : dépôt google/fonts, figé au commit ci-dessous. Licence SIL OFL 1.1 sans nom réservé : sous-ensemble et
# conversion permis sans renommage, à condition de livrer la licence (public/fonts/LICENSES.txt).
# Usage : zsh scripts/build-fonts.sh   (réseau + uvx ; écrit public/fonts/)
set -euo pipefail
# Date figée dans les fichiers produits (fontTools la lit) et versions d'outils épinglées : deux lancements
# donnent les mêmes octets.
export SOURCE_DATE_EPOCH=1790640000

ROOT=${0:A:h:h}
OUT=$ROOT/public/fonts
COMMIT=23e54b51ddffbc7713c583748e3bd86f62b1fa4a
BASE=https://raw.githubusercontent.com/google/fonts/$COMMIT/ofl
WORK=$(mktemp -d)
# Latin de base et Latin-1 (accents français), œ Œ, apostrophes et guillemets typographiques, tirets, puce,
# points de suspension, €, ™, signe moins. U+2027 (‧, séparateur des crédits, spec 4.3) est demandé mais absent
# des trois polices sources : le navigateur le prend dans une police système (pile de repli de tokens.css).
UNICODES="U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2013-2014,U+2018-201F,U+2022,U+2026,U+2027,U+20AC,U+2122,U+2212"

fetch() { curl -sfL -o "$WORK/$2" "$BASE/$1" }
fetch "bigshouldersdisplay/BigShouldersDisplay%5Bwght%5D.ttf" bsd.ttf
fetch "chakrapetch/ChakraPetch-Medium.ttf" chakra-500.ttf
fetch "chakrapetch/ChakraPetch-SemiBold.ttf" chakra-600.ttf
fetch "martianmono/MartianMono%5Bwdth,wght%5D.ttf" martian.ttf
fetch "bigshouldersdisplay/OFL.txt" bsd-OFL.txt
fetch "chakrapetch/OFL.txt" chakra-OFL.txt
fetch "martianmono/OFL.txt" martian-OFL.txt

# Graisses figées des polices variables : Big Shoulders Display 800 et 900 ; Martian Mono gardée variable
# de 300 à 400, largeur figée à 100 (sa valeur par défaut).
instance() { uvx --from fonttools==4.66.1 fonttools varLib.instancer "$WORK/$1" "${@:3}" -q -o "$WORK/$2" }
instance bsd.ttf bsd-800.ttf wght=800
instance bsd.ttf bsd-900.ttf wght=900
instance martian.ttf martian-300-400.ttf wght=300:400 wdth=100

mkdir -p "$OUT"
subset() {
  uvx --from "fonttools[woff]==4.66.1" --with brotli==1.2.0 pyftsubset "$WORK/$1" --unicodes="$UNICODES" --flavor=woff2 \
    --layout-features='*' --no-hinting --output-file="$OUT/$2"
}
subset bsd-800.ttf big-shoulders-display-800.woff2
subset bsd-900.ttf big-shoulders-display-900.woff2
subset chakra-500.ttf chakra-petch-500.woff2
subset chakra-600.ttf chakra-petch-600.woff2
subset martian-300-400.ttf martian-mono-300-400.woff2

{
  print "Polices livrées avec AGENTHOT, sous-ensembles woff2 des fichiers de github.com/google/fonts (commit $COMMIT)."
  print "Chacune est distribuée sous la SIL Open Font License 1.1, reproduite ci-dessous."
  for name in bsd chakra martian; do
    print "\n==== $name ====\n"
    cat "$WORK/$name-OFL.txt"
  done
} > "$OUT/LICENSES.txt"

trash "$WORK"
ls -l "$OUT"
