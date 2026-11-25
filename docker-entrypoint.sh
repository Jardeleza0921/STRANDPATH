#!/bin/sh
set -eu

# Mounted volumes are often root-owned. Fix the database directory, then run
# the application as the unprivileged node user.
if [ "$(id -u)" = "0" ]; then
  DB_DIR="$(dirname "${DB_PATH:-/data/strandpath.db}")"
  mkdir -p "$DB_DIR"
  chown -R node:node "$DB_DIR"
  exec gosu node "$@"
fi

exec "$@"
