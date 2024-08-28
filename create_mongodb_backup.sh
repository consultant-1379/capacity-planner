#!/bin/bash
BACKUP_ROOT=/export/CAP
BACKUP_DIR=$BACKUP_ROOT/`date "+%Y%m%d%H%M%S"`
echo "Backing up mongodb database to directory $BACKUP_DIR"
mkdir -p $BACKUP_DIR
if [[ $? -ne 0 ]]
then
  exit 1
fi
chmod 777 $BACKUP_DIR
docker run -v $BACKUP_DIR:/backup --network=capproduction_default mongo:3.4.10 mongodump --db=mean --excludeCollection=sessions --out /backup --host mongodb
