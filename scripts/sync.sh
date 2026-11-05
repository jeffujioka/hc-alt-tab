#!/bin/sh
# Copy the mods (and the shared src modules they import) into the Herdr app's mods folder.
# A copy, not a symlink: Herdr doesn't hot-reload symlinked mods.
set -eu
cd "$(dirname "$0")/.."
HOME_DIR="${HERDR_APP_HOME:-$HOME/.config/herdr-app}"
for dir in mods/*/; do
  m=$(basename "$dir")
  dest="$HOME_DIR/mods/$m"
  mkdir -p "$dest"
  rsync -a --delete --exclude recent.js --exclude dwell.js --exclude store.js "$dir" "$dest/"
  for f in recent.js dwell.js store.js; do
    [ -f "src/$f" ] && cp "src/$f" "$dest/$f"
  done
  herdr-app check "$dest"
done
