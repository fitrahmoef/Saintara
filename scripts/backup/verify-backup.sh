#!/bin/bash

#############################################
# Backup Verification Script for Saintara
#############################################
# This script verifies the integrity of backups
# Usage: ./verify-backup.sh [backup_file]
#        ./verify-backup.sh all  (verify all backups)
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKUP_DIR="${BACKUP_DIR:-./backups}"

# Function to verify a single backup
verify_backup() {
  local backup_file="$1"
  local filename=$(basename "${backup_file}")

  echo -e "${BLUE}🔍 Verifying: ${filename}${NC}"

  # Check file exists
  if [ ! -f "${backup_file}" ]; then
    echo -e "${RED}❌ File not found${NC}"
    return 1
  fi

  # Check file size
  local size=$(stat -f%z "${backup_file}" 2>/dev/null || stat -c%s "${backup_file}" 2>/dev/null)
  local size_mb=$((size / 1024 / 1024))

  if [ ${size} -eq 0 ]; then
    echo -e "${RED}❌ File is empty (0 bytes)${NC}"
    return 1
  fi

  echo "   Size: ${size_mb} MB"

  # Verify gzip integrity
  if gunzip -t "${backup_file}" 2>/dev/null; then
    echo -e "${GREEN}✅ Integrity check passed${NC}"

    # Check metadata if exists
    if [ -f "${backup_file}.meta" ]; then
      echo "   Metadata:"
      cat "${backup_file}.meta" | grep -E "backup_date|database_name" | sed 's/^/   /'
    fi

    return 0
  else
    echo -e "${RED}❌ Integrity check failed - file is corrupted${NC}"
    return 1
  fi
}

# Main logic
if [ -z "$1" ]; then
  echo -e "${YELLOW}Usage: $0 <backup_file>${NC}"
  echo -e "${YELLOW}   or: $0 all${NC}"
  exit 1
fi

if [ "$1" == "all" ]; then
  # Verify all backups
  echo -e "${YELLOW}🔍 Verifying all backups in ${BACKUP_DIR}...${NC}"
  echo ""

  TOTAL=0
  PASSED=0
  FAILED=0

  for backup in $(find "${BACKUP_DIR}" -name "*.sql.gz" -type f | sort); do
    TOTAL=$((TOTAL + 1))
    if verify_backup "${backup}"; then
      PASSED=$((PASSED + 1))
    else
      FAILED=$((FAILED + 1))
    fi
    echo ""
  done

  echo -e "${BLUE}================================${NC}"
  echo -e "${BLUE}Verification Summary${NC}"
  echo -e "${BLUE}================================${NC}"
  echo "Total backups: ${TOTAL}"
  echo -e "${GREEN}Passed: ${PASSED}${NC}"
  echo -e "${RED}Failed: ${FAILED}${NC}"

  if [ ${FAILED} -eq 0 ]; then
    echo -e "${GREEN}✅ All backups are valid${NC}"
    exit 0
  else
    echo -e "${RED}❌ Some backups are corrupted${NC}"
    exit 1
  fi

else
  # Verify single backup
  verify_backup "$1"
fi
