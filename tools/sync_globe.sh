#!/bin/sh
# Оновлює знімок проєкту Touch The Globe, з яким працює сторінка #/globe.
#     tools/sync_globe.sh [шлях до Touch_The_Globe_v2]
# Береться лише закомічене (make student-zip = git archive): без .env,
# еталонних розв'язків і робочих файлів.
set -e
HERE="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-$HERE/../Touch_The_Globe_v2}"
make -C "$SRC" student-zip
mkdir -p "$HERE/globe"
mv "$SRC/touch-the-globe-students.zip" "$HERE/globe/touch-the-globe.zip"
echo "Готово: globe/touch-the-globe.zip"
