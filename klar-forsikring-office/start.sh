#!/usr/bin/env bash
# Klar Forsikring — start kontoret. Præcis det samme som "node start.mjs".
set -euo pipefail
exec node "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/start.mjs" "$@"
