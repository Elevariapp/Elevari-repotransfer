#!/usr/bin/env bash
# Optimiza fotos de Glamping Waná (PNG → JPG, max 1600px) para menos RAM/disco en deploy
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../" && pwd)"
DIR="$ROOT/public/properties/glamping-wana"

if [[ ! -d "$DIR" ]]; then
  echo "No existe $DIR"
  exit 1
fi

if ! command -v sips >/dev/null 2>&1; then
  echo "sips no disponible (solo macOS). Convierte manualmente a JPG/WebP."
  exit 1
fi

count=0
for f in "$DIR"/*.png "$DIR"/*.PNG; do
  [[ -f "$f" ]] || continue
  base=$(basename "$f")
  name="${base%.*}"
  out="$DIR/${name}.jpg"
  echo "→ $base → ${name}.jpg"
  sips -s format jpeg -s formatOptions 82 --resampleWidth 1600 "$f" --out "$out" >/dev/null
  rm -f "$f"
  ((count++)) || true
done

echo ""
du -sh "$DIR"
echo "Optimizadas $count imagen(es). Actualiza seed si cambian nombres."
