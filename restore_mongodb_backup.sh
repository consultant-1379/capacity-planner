#!/bin/bash
BACKUP_DIR=$1
if [[ $BACKUP_DIR == "" ]] || [[ ! -d $BACKUP_DIR ]]
then
    echo "You must specify a valid directory to restore the database from"
    exit 1
fi
echo "Restoring mongodb database from directory $BACKUP_DIR"
docker run -it -v $BACKUP_DIR:/backup --network=capproduction_default mongo:3.4.10 mongorestore /backup --host mongodb --drop
