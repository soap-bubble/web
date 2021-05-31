resource "linode_lke_cluster" "test_soapbubble_dev_cluster" {
    label       = "soapbubble-dev-cluster"
    k8s_version = "1.20"
    region      = var.linode_region
    tags        = ["dev"]

    pool {
        type  = "g6-standard-2"
        count = 2
    }
}
