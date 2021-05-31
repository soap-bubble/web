variable "region" {
  default     = "us-central1"
  description = "GCP region"
}

variable "project" {
  default     = "soapbubble-dev"
  description = "GCP project"
}

variable "ingress-ip" {
  default     = "null"
  description = "Linode ingress IP"
}
