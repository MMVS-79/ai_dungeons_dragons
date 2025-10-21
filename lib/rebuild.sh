#!/bin/bash

# Change to the project root (one level up from script location)
cd "$(dirname "$0")/.."

# Only pull if not in detached HEAD state
if git symbolic-ref --short HEAD >/dev/null 2>&1; then
  git pull
else
  echo "Repo is in detached HEAD state, skipping git pull"
fi

# Change to the directory where this script is located
cd lib

# Load environment variables from .env if it exists
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

# Use the same env vars as db.ts
MYSQL_USER="$DB_USER"
MYSQL_PASS="$DB_PASS"
MYSQL_DB="$DB_NAME"
MYSQL_HOST="$DB_HOST"

CHECKSUM_FILE=".last_schema_checksum"
NEW_CHECKSUM=$(cat rebuild.sql schema/tables/*.sql | sha1sum | awk '{print $1}')

FORCE=0
if [[ "$1" == "--force" ]]; then
  FORCE=1
fi

if [ -f "$CHECKSUM_FILE" ]; then
  OLD_CHECKSUM=$(cat "$CHECKSUM_FILE")
else
  OLD_CHECKSUM=""
fi

if [ "$NEW_CHECKSUM" != "$OLD_CHECKSUM" ] || [ "$FORCE" -eq 1 ]; then
  echo "Schema or rebuild.sql changed or force flag set. Running rebuild.sql..."
  mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" < rebuild.sql
  echo "$NEW_CHECKSUM" > "$CHECKSUM_FILE"
else
  echo "No changes detected in schema or rebuild.sql."
fi