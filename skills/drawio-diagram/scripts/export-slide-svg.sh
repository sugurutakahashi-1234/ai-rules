#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: bash scripts/export-slide-svg.sh <input.drawio> <output.svg>"
  echo "スライド埋め込み用の SVG を書き出す（余白 10px）。書き出したパスを標準出力に出す"
}
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then usage; exit 0; fi
if [[ $# -ne 2 ]]; then usage >&2; exit 2; fi

input=$1
output=$2

if [[ ! -f "$input" ]]; then
  echo "input not found: $input" >&2
  exit 2
fi

if command -v drawio >/dev/null 2>&1; then
  drawio_bin=$(command -v drawio)
elif command -v draw.io >/dev/null 2>&1; then
  drawio_bin=$(command -v draw.io)
elif [[ -x /Applications/draw.io.app/Contents/MacOS/draw.io ]]; then
  drawio_bin=/Applications/draw.io.app/Contents/MacOS/draw.io
else
  echo "draw.io Desktop CLI not found" >&2
  exit 127
fi

mkdir -p "$(dirname "$output")"
"$drawio_bin" -x -f svg -b 10 -o "$output" "$input"

if [[ ! -s "$output" ]]; then
  echo "SVG export failed: $output" >&2
  exit 1
fi

echo "$output"
