#!/bin/bash
export COMPOSE_PROJECT_NAME="capproduction"
time docker-compose -f docker-compose-production.yml pull
if [[ $? -ne 0 ]]
then
    exit 1
fi
SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
${SCRIPTDIR}/create_mongodb_backup.sh
if [[ $? -ne 0 ]]
then
    exit 1
fi
time docker-compose -f docker-compose-production.yml up -d
