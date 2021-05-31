terraform {
  backend "gcs" {
    bucket  = "soapbubble-tf-state-dev"
    prefix  = "terraform/state"
  }
}
