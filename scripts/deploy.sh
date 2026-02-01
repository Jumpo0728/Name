#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=${1:-.env.production}
IMAGE_TAG=${2:-syncnote-api:latest}

if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file not found: $ENV_FILE" >&2
  exit 1
fi

docker build -t "$IMAGE_TAG" .

docker run -d --restart=always \
  --name syncnote-api \
  --env-file "$ENV_FILE" \
  -p 4000:4000 \
  "$IMAGE_TAG"
