#!/usr/bin/env bash
set -euo pipefail

# 図単体の目視確認用PNGを書き出す（スライド埋め込みにはexport-slide-svg.shのSVGを使う）
if [[ $# -ne 2 ]]; then
  echo "usage: bash scripts/export-check-png.sh <input.drawio> <output.png>" >&2
  exit 2
fi

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
"$drawio_bin" -x -f png -b 10 -s 1.5 -o "$output" "$input"

if [[ ! -s "$output" ]]; then
  echo "PNG export failed: $output" >&2
  exit 1
fi

echo "$output"
