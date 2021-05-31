#!/bin/bash
set -eo pipefail
set -o allexport; source $1; set +o allexport

PROJECT_ID=$2
BUCKET_ID=$PROJECT_ID-secrets
SECRETS=( kubeconfig twitch_client twitch_secret twitch_profile_id discord_token)

for secret in "${SECRETS[@]}"
do
  if berglas access $BUCKET_ID/$secret 1> /dev/null 2> /dev/null; then
    berglas update $BUCKET_ID/$secret ${!secret}
  else
    berglas create $BUCKET_ID/$secret ${!secret} --key projects/$PROJECT_ID/locations/global/keyRings/berglas/cryptoKeys/berglas-key
  fi
  berglas grant $BUCKET_ID/$secret --member serviceAccount:vault-decrypt@$PROJECT_ID.iam.gserviceaccount.com
done
