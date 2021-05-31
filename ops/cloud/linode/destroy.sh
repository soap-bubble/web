#!/bin/bash
set -eo pipefail

# kubectl config delete-context $(kubectl config current-context)

terraform destroy
