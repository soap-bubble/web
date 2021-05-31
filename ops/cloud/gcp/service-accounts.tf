

resource "google_service_account" "dns01_solver_service_account" {
  account_id   = "dns01-solver"
  display_name = "LE DNS solver"
}

resource "google_service_account_key" "dns01_solver_key" {
  service_account_id = google_service_account.dns01_solver_service_account.name
}

resource "google_project_iam_binding" "project" {
  project = var.project
  role    = "roles/dns.admin"

  members = [
    "serviceAccount:${google_service_account.dns01_solver_service_account.email}",
  ]
}
