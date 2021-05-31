# Cloudflare Managed Resources

Contains Cloudflare resources for soapbubble

## Bootstrapping

Requires a Cloudflare account API key, email and account ID:

```
export CLOUDFLARE_EMAIL={email}
export CLOUDFLARE_API_KEY={global API key}
export CLOUDFLARE_ACCOUNT_ID={cloudflare account ID}
```

Terraform state is stored in AWS and is created by the /ops/tools/bootstrap terraform. If running from a fresh terraform state and assuming the BundlePledge zone already exists in CloudFlare, then import the zone:

```
terraform init
terraform import cloudflare_zone.bundle_pledge {bundle pledge zone ID}
```

## Updating

```
./plan.sh
./apply.sh
```
