terraform {
  backend "gcs" {
    bucket  = "soapbubble-tf-state-dev"
    prefix  = "terraform/linode/state"
  }
}
