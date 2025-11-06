#!/bin/bash

#############################################
# Cron Setup Script for Automated Backups
#############################################
# This script sets up automated daily backups
# Usage: ./setup-cron.sh
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup-database.sh"
LOG_DIR="${SCRIPT_DIR}/../../logs/backup"

# Default backup time (2 AM daily)
BACKUP_HOUR="${BACKUP_HOUR:-2}"
BACKUP_MINUTE="${BACKUP_MINUTE:-0}"

echo -e "${YELLOW}🔧 Setting up automated database backups...${NC}"
echo ""

# Check if backup script exists
if [ ! -f "${BACKUP_SCRIPT}" ]; then
  echo -e "${RED}❌ Backup script not found: ${BACKUP_SCRIPT}${NC}"
  exit 1
fi

# Make backup script executable
chmod +x "${BACKUP_SCRIPT}"

# Create log directory
mkdir -p "${LOG_DIR}"

# Create cron job
CRON_COMMAND="${BACKUP_MINUTE} ${BACKUP_HOUR} * * * ${BACKUP_SCRIPT} >> ${LOG_DIR}/backup-\$(date +\%Y\%m\%d).log 2>&1"

echo "Cron schedule: Daily at ${BACKUP_HOUR}:$(printf %02d ${BACKUP_MINUTE}) AM"
echo "Backup script: ${BACKUP_SCRIPT}"
echo "Log directory: ${LOG_DIR}"
echo ""

read -p "Do you want to install this cron job? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo -e "${YELLOW}🚫 Cron setup cancelled${NC}"
  echo ""
  echo "To manually add the cron job, run:"
  echo "  crontab -e"
  echo ""
  echo "And add this line:"
  echo "  ${CRON_COMMAND}"
  exit 0
fi

# Add to crontab
(crontab -l 2>/dev/null | grep -v "${BACKUP_SCRIPT}"; echo "${CRON_COMMAND}") | crontab -

echo -e "${GREEN}✅ Cron job installed successfully!${NC}"
echo ""
echo "Current crontab:"
crontab -l | grep "${BACKUP_SCRIPT}"
echo ""
echo "Logs will be stored in: ${LOG_DIR}"
echo ""
echo "To verify cron is running:"
echo "  sudo systemctl status cron  # Ubuntu/Debian"
echo "  sudo systemctl status crond # CentOS/RHEL"
echo ""
echo "To view backup logs:"
echo "  tail -f ${LOG_DIR}/backup-$(date +%Y%m%d).log"
