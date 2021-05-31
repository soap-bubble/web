output  "dns01_solver_service_account" {
  value       = google_service_account_key.dns01_solver_key.private_key
  sensitive   = true
  description = "service account private key for LE DNS solver"
}
