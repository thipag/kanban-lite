output "deployment_directory" {
  value = var.project_dir
}

output "api_internal_endpoint" {
  value = "http://127.0.0.1:${var.api_port}"
}

output "app_site_url" {
  value = "https://${var.app_server_name}"
}

output "registry_site_url" {
  value = "https://${var.registry_server_name}"
}
