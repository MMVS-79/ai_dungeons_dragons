#!/bin/bash

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

if [ "$NEW_CHECKSUM" != "$OLD_CHECKSUM" ] || [ "$FORCE" -eq 1 ]; then
  echo "Schema or rebuild.sql changed or force flag set. Running rebuild.sql..."
  mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" < rebuild.sql
  echo "$NEW_CHECKSUM" > "$CHECKSUM_FILE"
else
  echo "No changes detected in schema or rebuild.sql."
fi