module "cloud-dns" {
  source  = "terraform-google-modules/cloud-dns/google"
  version = "3.1.0"
  project_id = var.project
  type = "public"
  name = "soapbubble-dev"
  domain = "soapbubble.online."
  description = "DNS for soapbubble.online"

  recordsets = [
    {
      name = ""
      type = "A"
      ttl = 300
      records = [
        "151.101.1.195",
        "151.101.65.195"
      ]
    }, 
    {
      name = ""
      type = "MX"
      ttl = 600
      records = [
        "1 ASPMX.L.GOOGLE.COM.",
        "5 ALT1.ASPMX.L.GOOGLE.COM.",
        "5 ALT2.ASPMX.L.GOOGLE.COM.",
        "10 ALT3.ASPMX.L.GOOGLE.COM.",
        "10 ALT4.ASPMX.L.GOOGLE.COM."
      ]
    },
    {
      name = ""
      type = "TXT"
      ttl = 3600
      records = [
        "\"dns/owner=050b9786-8f77-40c7-8745-8e922be586ce_soapbubble-online,external-dns/resource=ingress/cattle-global-data/globaldns-ingress-gd-rbxjt\"",
        "\"v=spf1 include:_spf.firebasemail.com ~all\"",
        "\"firebase=soapbubble\"",
        "\"google-site-verification=TBvrYh1Qv6aIW58xgw_gl4mOW0mI3320GhZJenkf1TY\"",
      ]
    },
    {
      name = "firebase1._domainkey"
      type = "CNAME"
      ttl = 3600
      records = [
        "mail-soapbubble-online.dkim1._domainkey.firebasemail.com."
      ]
    },
    {
      name = "firebase2._domainkey"
      type = "CNAME"
      ttl = 3600
      records = [
        "mail-soapbubble-online.dkim2._domainkey.firebasemail.com."
      ]
    },
    {
      name = "twitch"
      type = "A"
      ttl = 3600
      records = [
        "216.230.232.24",
        "216.230.232.53",
        "216.230.232.54",
      ]
    }
  ]
}
