#!/bin/bash
# Script used to backup MongoDB data
# To be run nightly at 11pm via crontab entry
# 0 23 * * * /cap/capacity-planner/backup_retention_policy.sh

BACKUP_LOCATION=/export/CAP
TODAYS_BACKUPS=$BACKUP_LOCATION/`date "+%Y%m%d"`
RENTENTION_PERIOD=$((30*24*60)) #30 days

echo "Performing daily backup of mongoDB database to $TODAYS_BACKUPS.zip"
zip -r $TODAYS_BACKUPS $TODAYS_BACKUPS*
if [[ $? -ne 0 ]]
then
  exit 1
fi
echo "Removing hourly backup folders as they are no longer needed."
rm -rf $TODAYS_BACKUPS*/
echo "Removing backups older than 30 days from $BACKUP_LOCATION."
`find $BACKUP_LOCATION -name "*.zip" -type d -mmin +."$RENTENTION_PERIOD" | xargs rm -rf`
