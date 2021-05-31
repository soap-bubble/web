terraform {
  backend "s3" {
    bucket         = "soapbubble-terraform-up-and-running-state"
    key            = "cloudflare/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "soapbubble-terraform-up-and-running-locks"
    encrypt        = true
  }
}
