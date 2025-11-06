#!/bin/bash

#############################################
# List Backups Script for Saintara
#############################################
# This script lists all available backups
# Usage: ./list-backups.sh
#############################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKUP_DIR="${BACKUP_DIR:-./backups}"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Available Database Backups${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

if [ ! -d "${BACKUP_DIR}" ]; then
  echo -e "${YELLOW}⚠️  Backup directory not found: ${BACKUP_DIR}${NC}"
  exit 1
fi

BACKUP_COUNT=0

for backup in $(find "${BACKUP_DIR}" -name "*.sql.gz" -type f | sort -r); do
  BACKUP_COUNT=$((BACKUP_COUNT + 1))
  filename=$(basename "${backup}")
  size=$(du -h "${backup}" | cut -f1)

  # Get modification time
  if [ "$(uname)" == "Darwin" ]; then
    # macOS
    modtime=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "${backup}")
  else
    # Linux
    modtime=$(stat -c "%y" "${backup}" | cut -d'.' -f1)
  fi

  echo -e "${GREEN}📦 ${filename}${NC}"
  echo "   Size: ${size}"
  echo "   Date: ${modtime}"

  # Show metadata if exists
  if [ -f "${backup}.meta" ]; then
    if command -v jq &> /dev/null; then
      db_name=$(cat "${backup}.meta" | jq -r '.database_name' 2>/dev/null)
      if [ ! -z "$db_name" ] && [ "$db_name" != "null" ]; then
        echo "   Database: ${db_name}"
      fi
    fi
  fi

  echo ""
done

if [ ${BACKUP_COUNT} -eq 0 ]; then
  echo -e "${YELLOW}⚠️  No backups found in ${BACKUP_DIR}${NC}"
else
  echo -e "${BLUE}Total backups: ${BACKUP_COUNT}${NC}"

  # Calculate total size
  total_size=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
  echo -e "${BLUE}Total size: ${total_size}${NC}"
fi
