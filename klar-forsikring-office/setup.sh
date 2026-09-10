#!/usr/bin/env bash
# Klar Forsikring — opsætning. Præcis det samme som "node setup.mjs"; ligger her for vanens skyld.
set -euo pipefail
exec node "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/setup.mjs" "$@"
