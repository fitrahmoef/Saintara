#!/bin/bash

#######################################################
# Automated PostgreSQL Database Backup Script
#
# This script creates daily backups of the Saintara database
# and uploads them to S3 (or stores locally)
#
# Usage:
#   ./backup-database.sh [OPTIONS]
#
# Options:
#   --local-only    Only save backup locally (don't upload to S3)
#   --s3-bucket     S3 bucket name for backup storage
#   --retention     Number of days to retain backups (default: 30)
#######################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_FILE="saintara_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Database credentials (from environment variables)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-saintara}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Backup retention (days)
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# S3 configuration (optional)
S3_BUCKET="${S3_BUCKET:-}"
LOCAL_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --local-only)
      LOCAL_ONLY=true
      shift
      ;;
    --s3-bucket)
      S3_BUCKET="$2"
      shift 2
      ;;
    --retention)
      RETENTION_DAYS="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "========================================="
echo "Saintara Database Backup"
echo "========================================="
echo "Timestamp: $(date)"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo "Retention: $RETENTION_DAYS days"
echo "========================================="

# Create backup
echo "Creating database backup..."
export PGPASSWORD="$DB_PASSWORD"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip > "$BACKUP_PATH"

BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
echo "✓ Backup created: $BACKUP_PATH ($BACKUP_SIZE)"

# Verify backup integrity
echo "Verifying backup integrity..."
if gunzip -t "$BACKUP_PATH" 2>/dev/null; then
  echo "✓ Backup verification successful"
else
  echo "✗ Backup verification failed!"
  exit 1
fi

# Upload to S3 (if configured and not local-only)
if [ "$LOCAL_ONLY" = false ] && [ -n "$S3_BUCKET" ]; then
  echo "Uploading backup to S3..."

  if command -v aws &> /dev/null; then
    aws s3 cp "$BACKUP_PATH" "s3://${S3_BUCKET}/backups/database/${BACKUP_FILE}" \
      --storage-class STANDARD_IA \
      --server-side-encryption AES256
    echo "✓ Backup uploaded to s3://${S3_BUCKET}/backups/database/${BACKUP_FILE}"

    # Also upload a "latest" symlink for easy access
    echo "$BACKUP_FILE" > "${BACKUP_DIR}/latest.txt"
    aws s3 cp "${BACKUP_DIR}/latest.txt" "s3://${S3_BUCKET}/backups/database/latest.txt"
  else
    echo "⚠ AWS CLI not found, skipping S3 upload"
  fi
fi

# Clean up old local backups
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "saintara_backup_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -delete
DELETED_COUNT=$(find "$BACKUP_DIR" -name "saintara_backup_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" | wc -l)
echo "✓ Deleted $DELETED_COUNT old backup(s)"

# Clean up old S3 backups (if configured)
if [ "$LOCAL_ONLY" = false ] && [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
  echo "Cleaning up old S3 backups..."

  # Calculate date threshold
  THRESHOLD_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)

  # List and delete old backups
  aws s3 ls "s3://${S3_BUCKET}/backups/database/" | while read -r line; do
    FILE_DATE=$(echo "$line" | awk '{print $4}' | grep -oP 'saintara_backup_\K[0-9]{8}' || true)

    if [ -n "$FILE_DATE" ] && [ "$FILE_DATE" -lt "$THRESHOLD_DATE" ]; then
      FILE_NAME=$(echo "$line" | awk '{print $4}')
      aws s3 rm "s3://${S3_BUCKET}/backups/database/${FILE_NAME}"
      echo "  Deleted: $FILE_NAME"
    fi
  done
fi

# Summary
echo "========================================="
echo "Backup Summary"
echo "========================================="
echo "Status: SUCCESS"
echo "Backup file: $BACKUP_FILE"
echo "Size: $BACKUP_SIZE"
echo "Location: $BACKUP_PATH"
[ "$LOCAL_ONLY" = false ] && [ -n "$S3_BUCKET" ] && echo "S3 Location: s3://${S3_BUCKET}/backups/database/${BACKUP_FILE}"
echo "========================================="

# Send notification (optional - can integrate with Slack, Discord, email, etc.)
if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
  curl -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"✓ Saintara database backup completed: $BACKUP_FILE ($BACKUP_SIZE)\"}" \
    2>/dev/null || true
fi

echo "✓ Backup completed successfully at $(date)"
