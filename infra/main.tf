terraform {
  required_version = ">= 1.5.0"
  required_providers {
    null = {
      source  = "hashicorp/null"
      version = ">= 3.2.1"
    }
  }
}

locals {
  frontend_dist_dir     = var.frontend_dist_dir != null ? abspath(var.frontend_dist_dir) : abspath("${path.module}/../web/dist")
  compose_file          = templatefile("${path.module}/templates/docker-compose.yaml.tftpl", { backend_image = var.backend_image, api_port = var.api_port, postgres_network_name = var.postgres_network_name })
  env_file              = templatefile("${path.module}/templates/app.env.tftpl", { database_url = var.database_url, api_port = var.api_port, frontend_origin = var.frontend_origin })
  app_site_config       = templatefile("${path.module}/templates/apache-app.conf.tftpl", {
    server_name               = var.app_server_name
    server_alias              = var.app_server_alias
    static_root               = var.static_root
    api_port                  = var.api_port
    api_subpath               = var.api_subpath
    ssl_certificate_file      = var.ssl_certificate_file
    ssl_certificate_key_file  = var.ssl_certificate_key_file
    ssl_certificate_chain_file = var.ssl_certificate_chain_file
    apache_log_dir            = var.apache_log_dir
  })
  registry_site_config  = templatefile("${path.module}/templates/apache-registry.conf.tftpl", {
    server_name               = var.registry_server_name
    registry_port             = var.registry_port
    ssl_certificate_file      = var.ssl_certificate_file
    ssl_certificate_key_file  = var.ssl_certificate_key_file
    ssl_certificate_chain_file = var.ssl_certificate_chain_file
    htpasswd_file             = "${var.apache_htpasswd_dir}/${replace(var.registry_server_name, ".", "-")}.htpasswd"
    apache_log_dir            = var.apache_log_dir
  })
  registry_unit_content  = templatefile("${path.module}/templates/docker-registry.service.tftpl", { registry_port = var.registry_port, registry_data_dir = var.registry_data_dir })
  registry_htpasswd     = templatefile("${path.module}/templates/registry.htpasswd.tftpl", {
    username      = var.registry_basic_auth_user
    password_hash = var.registry_basic_auth_password_hash
  })
  app_site_filename     = "${replace(var.app_server_name, ".", "-")}.conf"
  registry_site_filename = "${replace(var.registry_server_name, ".", "-")}.conf"
  registry_htpasswd_filename = "${replace(var.registry_server_name, ".", "-")}.htpasswd"
  frontend_archive_path = "${path.module}/frontend-dist.zip"
  registry_password_b64 = base64encode(var.registry_basic_auth_password)
  ssh_password_clean    = trimspace(var.ssh_password)
  sudo_password_clean   = trimspace(var.sudo_password) != "" ? trimspace(var.sudo_password) : local.ssh_password_clean
  sudo_password_b64     = base64encode(local.sudo_password_clean)
  sudo_prefix           = "echo ${local.sudo_password_b64} | base64 -d | sudo -S"
  registry_auth_enabled = trimspace(var.registry_basic_auth_password) != ""
}

data "archive_file" "frontend_dist" {
  type        = "zip"
  source_dir  = local.frontend_dist_dir
  output_path = local.frontend_archive_path
}

resource "null_resource" "host_setup" {
  triggers = {
    project_dir   = var.project_dir
    static_root   = var.static_root
    registry_dir  = var.registry_data_dir
    htpasswd_dir  = var.apache_htpasswd_dir
  }

  connection {
    type        = "ssh"
    host        = var.ssh_host
    user        = var.ssh_user
    port        = var.ssh_port
    password    = var.ssh_password
    timeout     = "45s"
  }

  provisioner "remote-exec" {
    inline = [
      "set -e",
      "if ! command -v docker >/dev/null 2>&1; then ${local.sudo_prefix} apt-get update && ${local.sudo_prefix} apt-get install -y docker.io; fi",
      "if ! docker compose version >/dev/null 2>&1; then ${local.sudo_prefix} apt-get update && ${local.sudo_prefix} apt-get install -y docker-compose-plugin; fi",
      "if ! command -v unzip >/dev/null 2>&1; then ${local.sudo_prefix} apt-get update && ${local.sudo_prefix} apt-get install -y unzip; fi",
      "if ! command -v apache2 >/dev/null 2>&1; then ${local.sudo_prefix} apt-get update && ${local.sudo_prefix} apt-get install -y apache2; fi",
      "${local.sudo_prefix} systemctl enable docker",
      "${local.sudo_prefix} systemctl start docker",
      "${local.sudo_prefix} systemctl enable apache2",
      "${local.sudo_prefix} systemctl start apache2",
      "${local.sudo_prefix} a2enmod proxy proxy_http headers rewrite ssl",
      "${local.sudo_prefix} mkdir -p ${var.project_dir}",
      "${local.sudo_prefix} chown ${var.ssh_user}:${var.ssh_user} ${var.project_dir}",
      "${local.sudo_prefix} mkdir -p ${var.static_root}",
      "${local.sudo_prefix} mkdir -p ${var.registry_data_dir}",
      "${local.sudo_prefix} mkdir -p ${var.apache_htpasswd_dir}",
    ]
  }
}

resource "null_resource" "registry_stack" {
  depends_on = [null_resource.host_setup]

  triggers = {
    unit_hash              = sha1(local.registry_unit_content)
    registry_site_hash     = sha1(local.registry_site_config)
    registry_htpasswd_hash = sha1(local.registry_htpasswd)
    registry_port          = tostring(var.registry_port)
  }

  connection {
    type        = "ssh"
    host        = var.ssh_host
    user        = var.ssh_user
    port        = var.ssh_port
    password    = var.ssh_password
    timeout     = "45s"
  }

  provisioner "file" {
    content     = local.registry_unit_content
    destination = "/tmp/docker-registry.service"
  }

  provisioner "file" {
    content     = local.registry_site_config
    destination = "/tmp/${local.registry_site_filename}"
  }

  provisioner "file" {
    content     = local.registry_htpasswd
    destination = "/tmp/${local.registry_htpasswd_filename}"
  }

  provisioner "remote-exec" {
    inline = [
      "${local.sudo_prefix} mv /tmp/docker-registry.service /etc/systemd/system/docker-registry.service",
      "${local.sudo_prefix} systemctl daemon-reload",
      "${local.sudo_prefix} systemctl enable docker-registry",
      "${local.sudo_prefix} systemctl restart docker-registry",
    ]
  }

  provisioner "remote-exec" {
    inline = [
      "${local.sudo_prefix} mv /tmp/${local.registry_site_filename} ${var.apache_sites_available_dir}/${local.registry_site_filename}",
      "${local.sudo_prefix} mv /tmp/${local.registry_htpasswd_filename} ${var.apache_htpasswd_dir}/${local.registry_htpasswd_filename}",
      "${local.sudo_prefix} chown root:root ${var.apache_sites_available_dir}/${local.registry_site_filename}",
      "${local.sudo_prefix} chown root:${var.apache_group} ${var.apache_htpasswd_dir}/${local.registry_htpasswd_filename}",
      "${local.sudo_prefix} chmod 640 ${var.apache_htpasswd_dir}/${local.registry_htpasswd_filename}",
      "${local.sudo_prefix} a2ensite ${local.registry_site_filename}",
      "${local.sudo_prefix} systemctl reload apache2",
    ]
  }
}

resource "null_resource" "app_stack" {
  depends_on = [null_resource.host_setup, null_resource.registry_stack]

  triggers = {
    compose_hash           = sha1(local.compose_file)
    env_hash               = sha1(local.env_file)
    app_site_hash          = sha1(local.app_site_config)
    frontend_hash          = data.archive_file.frontend_dist.output_sha
    backend_image          = var.backend_image
    project_dir            = var.project_dir
    static_root            = var.static_root
    api_port               = tostring(var.api_port)
  }

  connection {
    type        = "ssh"
    host        = var.ssh_host
    user        = var.ssh_user
    port        = var.ssh_port
    password    = var.ssh_password
    timeout     = "45s"
  }

  provisioner "file" {
    content     = local.compose_file
    destination = "${var.project_dir}/docker-compose.yml"
  }

  provisioner "file" {
    content     = local.env_file
    destination = "${var.project_dir}/app.env"
  }

  provisioner "file" {
    source      = data.archive_file.frontend_dist.output_path
    destination = "/tmp/kanban-lite-dist.zip"
  }

  provisioner "file" {
    content     = local.app_site_config
    destination = "/tmp/${local.app_site_filename}"
  }

  provisioner "remote-exec" {
    inline = [
      "if [ \"${local.registry_auth_enabled}\" = \"true\" ]; then echo ${local.registry_password_b64} | base64 -d > /tmp/registry-pass && ${local.sudo_prefix} bash -lc \"cat /tmp/registry-pass | docker login ${var.registry_server_name} --username ${var.registry_basic_auth_user} --password-stdin\" && ${local.sudo_prefix} rm /tmp/registry-pass; fi",
      "${local.sudo_prefix} bash -lc \"cd ${var.project_dir} && docker compose pull\"",
      "${local.sudo_prefix} bash -lc \"cd ${var.project_dir} && docker compose up -d --remove-orphans\"",
    ]
  }

  provisioner "remote-exec" {
    inline = [
      "${local.sudo_prefix} find ${var.static_root} -mindepth 1 -delete",
      "${local.sudo_prefix} unzip -oq /tmp/kanban-lite-dist.zip -d ${var.static_root}",
      "${local.sudo_prefix} chown -R ${var.apache_user}:${var.apache_group} ${var.static_root}",
      "${local.sudo_prefix} mv /tmp/${local.app_site_filename} ${var.apache_sites_available_dir}/${local.app_site_filename}",
      "${local.sudo_prefix} chown root:root ${var.apache_sites_available_dir}/${local.app_site_filename}",
      "${local.sudo_prefix} a2ensite ${local.app_site_filename}",
      "${local.sudo_prefix} systemctl reload apache2",
    ]
  }
}
