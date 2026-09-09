#!/usr/bin/env bash
# Starter kontoret. Kør ./setup.sh først.
set -euo pipefail
PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -f "$PACK_DIR/.office-path" ] || { echo "Kør ./setup.sh først." >&2; exit 1; }
OFFICE_DIR="$(cat "$PACK_DIR/.office-path")"
[ -d "$OFFICE_DIR" ] || { echo "$OFFICE_DIR findes ikke. Kør ./setup.sh igen." >&2; exit 1; }
echo "Kontoret starter fra $OFFICE_DIR — åbn http://localhost:4520"
cd "$OFFICE_DIR" && exec npm start
