#!/bin/bash

# Project to use cloud run
PROJECT_ID='toys-8080'
PROJECT_NAME='My Toys'

# Used for image name and service name
APP_NAME='user-data-api-rails'

# "Cloud run" settings (more on "gcloud beta run deploy --help")
REGION='asia-northeast1'
PLATFORM='managed'
DEPLOY_OPTS=(
  --flags-file=set-env-vars.yml
  --allow-unauthenticated
  --memory=256Mi   # default 256Mi
  --concurrency=10 # default 80
  --timeout=1m     # default 5m
)

# Specify local image name and how to build it
LOCAL_IMAGE_NAME='backend_rails_prod'
LOCAL_BUILD_CMD='docker-compose build rails_prod'

. '../../cloud-run-script/run-main.sh'
