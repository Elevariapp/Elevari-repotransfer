#!/usr/bin/env bash
# Copia fotos de Glamping Waná → public/properties/glamping-wana/
# Uso: ./scripts/import-glamping-photos.sh "/Users/macbook/Downloads/Wana-Photos 1.0"
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../" && pwd)"
DEST="$ROOT/public/properties/glamping-wana"
SRC="${1:-}"

if [[ -z "$SRC" || ! -d "$SRC" ]]; then
  echo "Uso: $0 /ruta/a/carpeta-con-fotos"
  exit 1
fi

mkdir -p "$DEST"
rm -f "$DEST"/*
LIST=$(mktemp)
{
  ls "$SRC"/*.jpeg 2>/dev/null || true
  ls "$SRC"/*.jpg 2>/dev/null || true
  ls "$SRC"/*.webp 2>/dev/null || true
  ls "$SRC"/*.png 2>/dev/null || true
} > "$LIST"

i=1
while read -r f; do
  [[ -f "$f" ]] || continue
  ext="${f##*.}"
  ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')
  num=$(printf '%02d' "$i")
  if [[ "$i" -eq 1 ]]; then
    out="${num}-cover.${ext_lower}"
  else
    out="${num}.${ext_lower}"
  fi
  cp "$f" "$DEST/$out"
  echo "→ $out"
  ((i++)) || true
done < "$LIST"
rm -f "$LIST"

echo ""
echo "Listo: $((i - 1)) foto(s) en $DEST"
echo "Actualiza DB: cd api && npx prisma db seed"
