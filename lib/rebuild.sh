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

MYSQL_USER="$DB_USER"
MYSQL_PASS="$DB_PASS"
MYSQL_DB="$DB_NAME"
MYSQL_HOST="$DB_HOST"

CHECKSUM_FILE=".last_schema_checksum"
NEW_CHECKSUM=$(cat schema/tables/*.sql | sha1sum | awk '{print $1}')

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
  echo "Schema or table SQL changed or force flag set. Running rebuild..."

  TMP_SQL="full_rebuild.sql"
  echo "SET FOREIGN_KEY_CHECKS = 0;" > $TMP_SQL

  # Concatenate all table SQL files in your preferred order
  cat schema/tables/accounts.sql \
      schema/tables/campaigns.sql \
      schema/tables/chats.sql \
      schema/tables/logs.sql \
      schema/tables/races.sql \
      schema/tables/classes.sql \
      schema/tables/enemies.sql \
      schema/tables/characters.sql \
      schema/tables/items.sql \
      schema/tables/armours.sql \
      schema/tables/weapons.sql \
      schema/tables/shields.sql \
      schema/tables/character_items.sql \
      schema/tables/character_armours.sql \
      schema/tables/character_weapons.sql \
      schema/tables/character_shields.sql >> $TMP_SQL

  echo "SET FOREIGN_KEY_CHECKS = 1;" >> $TMP_SQL

  mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" < $TMP_SQL
  echo "$NEW_CHECKSUM" > "$CHECKSUM_FILE"
  rm $TMP_SQL
else
  echo "No changes detected in schema or table SQL."
fi
