#!/bin/bash
touch swagger.json
export COMPOSE_PROJECT_NAME="capdevelopment"
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
time docker-compose up --force-recreate
if [[ $? -ne 0 ]]
then
    exit 1
fi
