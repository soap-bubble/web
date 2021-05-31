output  "kubeconfig" {
  value       = linode_lke_cluster.test_soapbubble_dev_cluster.kubeconfig
  sensitive   = true
  description = "kubeconfig to access cluster"
}
