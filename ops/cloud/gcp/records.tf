

resource "google_dns_record_set" "twitch_soapbubble" {
  provider = google-beta
  managed_zone = module.cloud-dns.name
  name = "twitch.soapbubble.online."
  type = "A"
  rrdatas = [var.ingress-ip]
  ttl          = 86400
}
resource "google_dns_record_set" "docker_soapbubble" {
  provider = google-beta
  managed_zone = module.cloud-dns.name
  name = "docker.soapbubble.online."
  type = "A"
  rrdatas = [var.ingress-ip]
  ttl          = 86400
}
resource "google_dns_record_set" "hello_soapbubble" {
  provider = google-beta
  managed_zone = module.cloud-dns.name
  name = "hello.soapbubble.online."
  type = "A"
  rrdatas = [var.ingress-ip]
  ttl          = 86400
}
