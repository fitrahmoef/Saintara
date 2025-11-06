#!/bin/bash

#############################################
# Database Backup Script for Saintara
#############################################
# This script creates a compressed backup of the PostgreSQL database
# Usage: ./backup-database.sh [optional_backup_name]
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f "$(dirname "$0")/../../.env" ]; then
  export $(grep -v '^#' $(dirname "$0")/../../.env | xargs)
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${1:-backup_${TIMESTAMP}}"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql.gz"

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-saintara}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD}"

# If using DATABASE_URL (Neon/Supabase)
if [ ! -z "$DATABASE_URL" ]; then
  # Extract connection details from DATABASE_URL
  export PGPASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/.*:\(.*\)@.*/\1/p')
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p')
  DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\(.*\)?.*/\1/p' | cut -d'?' -f1)
  DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\(.*\):.*/\1/p')
else
  export PGPASSWORD="${DB_PASSWORD}"
fi

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo -e "${YELLOW}🔄 Starting database backup...${NC}"
echo "Database: ${DB_NAME}"
echo "Backup file: ${BACKUP_FILE}"

# Perform backup
if pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists | gzip > "${BACKUP_FILE}"; then

  BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo -e "${GREEN}✅ Backup completed successfully!${NC}"
  echo "Backup file: ${BACKUP_FILE}"
  echo "Backup size: ${BACKUP_SIZE}"

  # Create metadata file
  cat > "${BACKUP_FILE}.meta" <<EOF
{
  "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "database_name": "${DB_NAME}",
  "database_host": "${DB_HOST}",
  "backup_size": "${BACKUP_SIZE}",
  "backup_file": "${BACKUP_FILE}",
  "postgresql_version": "$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c 'SELECT version();' | head -n1 | xargs)"
}
EOF

  # Verify backup integrity
  echo -e "${YELLOW}🔍 Verifying backup integrity...${NC}"
  if gunzip -t "${BACKUP_FILE}" 2>/dev/null; then
    echo -e "${GREEN}✅ Backup integrity verified${NC}"
  else
    echo -e "${RED}❌ Backup integrity check failed!${NC}"
    exit 1
  fi

  # Clean up old backups (keep only last N days)
  echo -e "${YELLOW}🧹 Cleaning up old backups (keeping last ${RETENTION_DAYS} days)...${NC}"
  find "${BACKUP_DIR}" -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
  find "${BACKUP_DIR}" -name "backup_*.sql.gz.meta" -type f -mtime +${RETENTION_DAYS} -delete

  OLD_BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "backup_*.sql.gz" -type f | wc -l)
  echo "Remaining backups: ${OLD_BACKUP_COUNT}"

  echo -e "${GREEN}✅ Database backup completed successfully!${NC}"

else
  echo -e "${RED}❌ Backup failed!${NC}"
  exit 1
fi

# Unset password
unset PGPASSWORD
