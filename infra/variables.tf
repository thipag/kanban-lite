variable "ssh_host" {
  type = string
}

variable "ssh_user" {
  type = string
}

variable "ssh_port" {
  type    = number
  default = 22
}

variable "ssh_password" {
  type      = string
  sensitive = true
}

variable "sudo_password" {
  type      = string
  sensitive = true
  default   = ""
}

variable "project_dir" {
  type    = string
  default = "/opt/kanban-lite"
}

variable "backend_image" {
  type = string
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "frontend_origin" {
  type = string
}

variable "api_port" {
  type    = number
  default = 8000
}

variable "postgres_network_name" {
  type    = string
  default = ""
}

variable "registry_port" {
  type    = number
  default = 5000
}

variable "registry_data_dir" {
  type    = string
  default = "/var/lib/registry"
}

variable "app_server_name" {
  type = string
}

variable "app_server_alias" {
  type    = string
  default = ""
}

variable "registry_server_name" {
  type = string
}

variable "registry_basic_auth_user" {
  type = string
}

variable "registry_basic_auth_password_hash" {
  type      = string
  sensitive = true
}

variable "registry_basic_auth_password" {
  type      = string
  sensitive = true
}

variable "api_subpath" {
  type    = string
  default = "/api"
}

variable "static_root" {
  type    = string
  default = "/var/www/kanban-lite"
}

variable "frontend_dist_dir" {
  type    = string
  default = null
}

variable "apache_sites_available_dir" {
  type    = string
  default = "/etc/apache2/sites-available"
}

variable "apache_htpasswd_dir" {
  type    = string
  default = "/etc/apache2/htpasswd"
}

variable "apache_log_dir" {
  type    = string
  default = "/var/log/apache2"
}

variable "apache_user" {
  type    = string
  default = "www-data"
}

variable "apache_group" {
  type    = string
  default = "www-data"
}

variable "ssl_certificate_file" {
  type = string
}

variable "ssl_certificate_key_file" {
  type = string
}

variable "ssl_certificate_chain_file" {
  type    = string
  default = ""
}
