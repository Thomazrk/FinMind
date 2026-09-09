#!/usr/bin/env bash
# Klar Forsikring — sætter agents-office op med vores roster, brain, færdigheder og rutiner.
#
#   ./setup.sh [målmappe]      standard: ~/agents-office
#
# Scriptet henter agents-office fra GitHub (vi kopierer den ikke ind i dette repo), installerer
# den, og peger den på brain'et her i mappen. Alt, der er vores, bliver liggende her og er
# versionsstyret; agents-office-klonen kan altid smides væk og hentes igen.
set -euo pipefail

PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OFFICE_DIR="${1:-$HOME/agents-office}"
REPO="https://github.com/ajsahni/agents-office.git"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
die() { printf '\n\033[31mFejl:\033[0m %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null || die "git er ikke installeret."
command -v node >/dev/null || die "Node.js er ikke installeret. Hent Node 20+ på https://nodejs.org"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || die "Node 20 eller nyere kræves (du har $(node -v))."
command -v npm >/dev/null || die "npm er ikke installeret."
command -v claude >/dev/null || printf '\n\033[33mBemærk:\033[0m Claude Code (kommandoen "claude") blev ikke fundet. Kontoret starter, men agenterne arbejder kun med et Claude Code-login eller en ANTHROPIC_API_KEY.\n'

say "1/5  Henter agents-office → $OFFICE_DIR"
if [ -d "$OFFICE_DIR/.git" ]; then
  git -C "$OFFICE_DIR" pull --ff-only
else
  git clone "$REPO" "$OFFICE_DIR"
fi

say "2/5  Installerer"
(cd "$OFFICE_DIR" && npm install)

say "3/5  Peger kontoret på vores brain"
sed "s#BRAIN_PATH#$PACK_DIR/brain#" "$PACK_DIR/office.config.local.json.skabelon" \
  > "$OFFICE_DIR/office.config.local.json"
printf '%s\n' "$OFFICE_DIR" > "$PACK_DIR/.office-path"
cat "$OFFICE_DIR/office.config.local.json"

say "4/5  Bygger"
(cd "$OFFICE_DIR" && node build.mjs)

say "5/5  Tjekker roster, færdigheder og rutiner"
node "$PACK_DIR/validate.mjs" "$OFFICE_DIR" || die "Der er problemer i brain/Agents Office/. Ret dem og kør setup igen."

if [ "${FULL_CHECK:-0}" = "1" ]; then
  say "Ekstra: agents-office' egen testpakke (npm run check)"
  (cd "$OFFICE_DIR" && npm run check) || printf '\n\033[33mBemærk:\033[0m npm run check meldte fejl. Testen "smoke: browser" kræver Chrome og kan ignoreres — se efter andre linjer med ✗.\n'
fi

say "Færdig."
cat <<TXT
Start kontoret:      $PACK_DIR/start.sh
Eller:               cd "$OFFICE_DIR" && npm start
Åbn derefter:        http://localhost:4520

Vores ting ligger her og redigeres her:
  brain/                          notaterne agenterne læser
  brain/Agents Office/agents.json de 35 pladser
  brain/Agents Office/skills/     sådan gør vi tingene
  brain/Agents Office/routines.json  det kontoret gør af sig selv

Færdigheder og briefs virker fra næste opgave. Ændringer i agents.json kræver genstart.
Tjek vores filer igen når som helst:  node validate.mjs
TXT
