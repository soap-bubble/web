#!/usr/bin/env bash
set -e

image=$(echo $IMAGE)

if [ ! -z "$image" ]; then
  docker build -t $image --build-arg DEPLOYMENT=$1 -f www/Dockerfile www
  if $PUSH_IMAGE
  then
    docker push $image
  fi
fi

