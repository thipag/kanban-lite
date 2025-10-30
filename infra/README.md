# Infrastructure Deployment

## 1. Prepare local environment files

### Root `.env`

Copy the template and fill in the values that the Make targets require:

```bash
cp .env.example .env
```

| Variable | Meaning |
|----------|---------|
| `REGISTRY` | Base URL of the container registry (e.g. `registry.example.com`). |
| `REGISTRY_USERNAME` | Registry user with push permissions. Leave empty if not required. |
| `REGISTRY_PASSWORD` | Password used by `docker login` before pushes. |
| `BACKEND_IMAGE_NAME` | Repository name for the backend image (default `kanban-lite-api`). |
| `TAG` | Image tag applied during `make package-backend` (e.g. `2024-05-24.1`). |
| `TF_ARGS` | Extra flags passed to `terraform apply` (default `-auto-approve`). |

### Terraform variables

Create a private copy of the Terraform variable file:

```bash
cp infra/terraform.tfvars.example infra/terraform.tfvars
```

| Variable | Meaning |
|----------|---------|
| `ssh_host`, `ssh_user`, `ssh_port`, `ssh_password` | SSH endpoint used by Terraform provisioners. Password-based authentication is expected. |
| `sudo_password` | Optional sudo password; leave blank to reuse `ssh_password`. |
| `project_dir` | Location on the server where Compose files and env vars are written (default `/opt/kanban-lite`). |
| `backend_image` | Fully qualified backend image (e.g. `registry.example.com/kanban-lite-api:2024-05-24.1`). |
| `database_url` | SQLAlchemy DSN pointing at the production Postgres instance. |
| `frontend_origin` | Public URL served by Apache and used for FastAPI CORS. |
| `api_port` | Local port exposed by the backend container (default `8000`). |
| `postgres_network_name` | Optional external Docker network that the backend container should join. Leave blank if not needed. |
| `registry_port` | Local port bound by the private registry service (default `5000`). |
| `registry_data_dir` | Persistent volume path for the registry (default `/var/lib/registry`). |
| `app_server_name`, `app_server_alias` | Primary domain (and optional alias) for the frontend virtual host. |
| `registry_server_name` | Domain used by the registry virtual host. |
| `registry_basic_auth_user` | Basic-auth username enforced by Apache for registry access. |
| `registry_basic_auth_password` | Plaintext password used when Terraform runs `docker login`. Leave blank if not required. |
| `registry_basic_auth_password_hash` | Output of `htpasswd -nb <user> <password>`; Apache validates registry requests against this hash. |
| `api_subpath` | URL prefix proxied to the backend (default `/api`). |
| `static_root` | Directory where the compiled frontend is deployed (default `/var/www/kanban-lite`). |
| `frontend_dist_dir` | Override for the local Vite build directory (default `../web/dist`). |
| `apache_sites_available_dir`, `apache_htpasswd_dir`, `apache_log_dir` | Apache paths that receive the generated configuration (`/etc/apache2/sites-available`, `/etc/apache2/htpasswd`, `/var/log/apache2` by default). |
| `apache_user`, `apache_group` | Owner/group applied to the static files (default `www-data`). |
| `ssl_certificate_file`, `ssl_certificate_key_file`, `ssl_certificate_chain_file` | TLS assets already present on the server. The chain file is optional. |

## 2. Build and publish artifacts

Run the Make targets after the variables are configured:

- `make package-backend` — build the FastAPI image, log in to the registry, and push the new tag.
- `make package-frontend` — run `npm run build` and stage the Vite output in `web/dist`.
- `make deploy` — invoke both package targets and then run `terraform -chdir=infra apply $(TF_ARGS)`.

## 3. Terraform targets

To apply individual stages, use the `-target` flag:

- `terraform -chdir=infra apply -target=null_resource.host_setup`
- `terraform -chdir=infra apply -target=null_resource.registry_stack`
- `terraform -chdir=infra apply -target=null_resource.app_stack`

`null_resource` is a Terraform utility resource that exists solely to run provisioners (`remote-exec`, `file`, etc.). In this project the three blocks (`host_setup`, `registry_stack`, `app_stack`) act as logical checkpoints so you can roll out infrastructure in phases.
