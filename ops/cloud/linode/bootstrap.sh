#!/bin/bash
set -eo pipefail

# Required env vars: LETSENCRYPT_EMAIL, TF_VAR_linode_token, TF_VAR_linode_region, GCP_PROJECT_ID, REGISTRY_HTPASSWD, REGISTRY_HASHAREDSECRET
set -o allexport; source <(sops --decrypt .enc.env); source <(sops --decrypt ../gcp/.enc.env); set +o allexport

# Get and apply kubeconfig
terraform output -raw kubeconfig | base64 -d > kubeconfig
KUBECONFIG=$(pwd)/kubeconfig:$HOME/.kube/config kubectl config view --raw > new_config
cp new_config ~/.kube/config
rm kubeconfig new_config

# Install ingress nginx controller for ingress
echo "Installing ingress-nginx"
helm3 repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
kubectl create ns ingress-nginx &> /dev/null || true
helm3 upgrade --install ingress-nginx ingress-nginx/ingress-nginx --wait --set controller.publishService.enabled=true --namespace ingress-nginx

# # Install Cert Manager for Let's Encrypt certs
echo "Installing cert manager"
cd cert-manager
kubectl create ns cert-manager &> /dev/null || true
helm3 repo add jetstack https://charts.jetstack.io
helm3 upgrade --install cert-manager jetstack/cert-manager --version v1.3.1 --namespace cert-manager --set installCRDs=true
cd ..

# Create a dummy deploy to create an ingress and get an external IP
echo "Installing dummy helloworld service to acquire IP"
cd helloworld
kubectl create ns helloworld &> /dev/null || true
kubectl -n helloworld create deployment web --image=gcr.io/google-samples/hello-app:1.0  &> /dev/null || true
kubectl -n helloworld expose deployment web --type=NodePort --port=8080 &> /dev/null || true
kubectl apply -f ingress.yaml
bash -c 'external_ip=""; while [ -z $external_ip ]; do echo "Waiting for end point..."; external_ip=$(kubectl -n helloworld get ing example-ingress --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}"); [ -z "$external_ip" ] && sleep 2; done; echo "End point ready-" && echo $external_ip;'
cd ../gcp
terraform plan -var=ingress-ip=$(kubectl -n helloworld get ing example-ingress --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}") --out plan
terraform apply plan
terraform output -raw dns01_solver_service_account | base64 --decode > key.json
kubectl create secret generic clouddns-dns01-solver-svc-acct --from-file=key.json --namespace cert-manager &> /dev/null || true
rm key.json
kubectl delete ClusterIssuer/gcloud-dns &> /dev/null || true
cat <<EOF | kubectl create -f - 
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: gcloud-dns
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ${LETSENCRYPT_EMAIL}
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - dns01:
        cloudDNS:
          project: ${GCP_PROJECT_ID}
          serviceAccountSecretRef:
            name: clouddns-dns01-solver-svc-acct
            key: key.json
EOF
cd ../linode

# Create the private docker registry
echo "Installing docker registry"
cd docker-registry
kubectl create ns docker-registry &> /dev/null || true
helm3 repo add twuni https://helm.twun.io 
helm3 upgrade --install docker-registry twuni/docker-registry --values values.yaml --namespace docker-registry \
  --set secrets.htpasswd=$REGISTRY_HTPASSWD \
  --set secrets.haSharedSecret=$REGISTRY_HASHAREDSECRET
kubectl create ns soapbubble &> /dev/null || true
kubectl -n soapbubble delete secret docker-registry regcred &> /dev/null || true
kubectl -n soapbubble create secret docker-registry regcred \
  --docker-server=docker.soapbubble.online --docker-username=root \
  --docker-password=$REGISTRY_HTPASSWD \
  --docker-email=null@example.com
cd ..

# Install kube-prometheus-stack
echo "Installing prometheus stack"
cd prometheus
helm3 repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm3 repo add stable https://charts.helm.sh/stable
helm3 upgrade --create-namespace --install --namespace metrics --values values.yaml prometheus ../../../kubernetes/charts/external/kube-prometheus-stack/0.0.1
cd ..

# Put at the end because of needing to wait for some cert-manager stuff to be ready...
envsubst '$$LETSENCRYPT_EMAIL $$GCP_PROJECT_ID' < cert-manager/ClusterIssuer.yaml | kubectl apply -f -
