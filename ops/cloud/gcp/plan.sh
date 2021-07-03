#!/bin/bash
set -eo pipefail
set -o allexport; source <(sops --decrypt .enc.env); set +o allexport

terraform plan -var=ingress-ip=$(kubectl -n helloworld get ing example-ingress --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}") --out plan
