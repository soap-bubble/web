#!/bin/bash
set -eo pipefail
set -o allexport; source <(sops --decrypt .enc.env); set +o allexport

terraform plan --out plan
