  # Add a record to the domain
  resource "cloudflare_record" "docker_bundle_pledge" {
    zone_id = cloudflare_zone.bundle_pledge.id
    name    = "docker"
    value   = var.ingress-ip
    type    = "A"
    ttl     = 1
    proxied = true
  }

  resource "cloudflare_record" "bundle_pledge" {
    zone_id = cloudflare_zone.bundle_pledge.id
    name    = "bundlepledge.com"
    value   = var.ingress-ip
    type    = "A"
    ttl     = 1
    proxied = true
  }

resource "cloudflare_record" "www_bundle_pledge" {
  zone_id = cloudflare_zone.bundle_pledge.id
  name    = "www"
  value   = var.ingress-ip
  type    = "A"
  ttl     = 1
  proxied = true
}
