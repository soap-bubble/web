
### Helper variables

Before running any commands from this README, first set the project id

```bash
export PROJECT_ID=$(gcloud config get-value project)
```

## Load cluster with GCP service account

This steps and this secret is intionally left out of the repo.

In order to decode secrets in berglas vault, the cluster needs to be able to decrypt and access storage. 

Log in to gcloud and set the default application credentials:

```bash
gcloud auth application-default login
```

Enable some Google APIs:
```bash
gcloud services enable --project ${PROJECT_ID} \
  cloudkms.googleapis.com \
  storage-api.googleapis.com \
  storage-component.googleapis.com
```

Create a new service account, download the service account key, create the secret, delete the key:

```bash
gcloud iam service-accounts create vault-decrypt --display-name "Vault decrypter" --description "Workload service account to decrypt secrets from vault"
gcloud iam service-accounts keys create key.json --iam-account vault-decrypt@$PROJECT_ID.iam.gserviceaccount.com
JSON_KEY=$(cat key.json | base64 -w 0) envsubst '$$JSON_KEY' < ops/bootstrap/manifests/secrets.yaml | kubectl apply --namespace soapbubble -f -
rm key.json
```

## berglas

Berglas is used to manage secrets.

When working with berglas, set the BUCKET_IT var

```bash
export BUCKET_ID=${PROJECT_ID}-secrets
```

### Initialization

Only needs to be done once per GCP project

#### Bootstrap bucket and KMS

```bash
berglas bootstrap -b $BUCKET_ID -l us-central1 -p $PROJECT_ID
```

#### Install the berglas mutatingwebhook

Make sure kubectl is poing at the k8s cluster you want to install to

```bash
cd ops/bootstrap/berglas
gcloud services enable --project ${PROJECT_ID} cloudfunctions.googleapis.com
gcloud functions deploy berglas-secrets-webhook --project ${PROJECT_ID} --runtime go111 --entry-point F --trigger-http --allow-unauthenticated
sed "s|REPLACE_WITH_YOUR_URL|$(gcloud functions describe berglas-secrets-webhook --project ${PROJECT_ID} --format 'value(httpsTrigger.url)')|" deploy/webhook.yaml | kubectl apply --namespace soapbubble -f -
```

### Creating/updating secrets

Load all secrets into an .env.production file. Run

```bash
./ops/bootstrap/secrets.sh .env.production $PROJECT_ID
```

### Setting the kubeconfig for cloudbuild

In order for cloudbuild to connect to k8s cluster, it needs a kubeconfig file. Copy the kubeconfig (found at `~/.kube/config`, probably) to `$PWD/.kubeconfig`

Create or update the kubeconfig secret

```bash
berglas update $BUCKET_ID/kubeconfig @.kubeconfig --key projects/$PROJECT_ID/locations/global/keyRings/berglas/cryptoKeys/berglas-key --create-if-missing
```

If needed, grant cloudbuild access to this secret:

```bash
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format 'value(projectNumber)') SA_EMAIL=${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com berglas grant ${BUCKET_ID}/kubeconfig --member serviceAccount:${SA_EMAIL}
```

Remove the .kubeconfig if no longer needed:

```bash
rm .kubeconfig
```
