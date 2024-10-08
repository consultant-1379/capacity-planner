#!/bin/bash
export COMPOSE_PROJECT_NAME="captest"
time docker-compose down --volumes
if [[ $? -ne 0 ]]
then
    echo ok
fi
time docker-compose build
if [[ $? -ne 0 ]]
then
    exit 1
fi

time docker-compose run --rm nodejs "tests/styles.sh" --force-recreate
if [[ $? -ne 0 ]]
then
    exit 1
fi

time docker-compose run --rm nodejs "tests/server.sh" --force-recreate
if [[ $? -ne 0 ]]
then
    exit 1
fi

time docker-compose run --rm nodejs "tests/client.sh" --force-recreate
if [[ $? -ne 0 ]]
then
    exit 1
fi

time docker-compose down --volumes
