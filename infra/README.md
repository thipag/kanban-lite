# Infrastructure Deployment

## 1. Prepare local environment files

1. Copy the root environment template and populate the registry settings used by the Make targets. Keep this file out of version control.
   ```bash
   cp .env.example .env
   ```
   | Variable | Meaning |
   |----------|---------|
   | `REGISTRY` | Base URL of your private registry (e.g. `registry.example.com`). |
   | `REGISTRY_USERNAME` | User that has push access to the registry. Leave empty if anonymous pushes are allowed. |
   | `REGISTRY_PASSWORD` | Password used by `docker login` before pushing the backend image. |
   | `BACKEND_IMAGE_NAME` | Repository name for the backend image (default `kanban-lite-api`). |
   | `TAG` | Version tag applied to the backend image (e.g. `2024-05-24.1`). |
   | `TF_ARGS` | Extra arguments passed to `terraform apply` (default `-auto-approve`). |

2. Copy the Terraform variables template, fill in host access and domain data, and save it as `infra/terraform.tfvars` (ignored by git).
   ```bash
   cp infra/terraform.tfvars.example infra/terraform.tfvars
   ```
   | Variable | Meaning |
   |----------|---------|
| `ssh_host`, `ssh_user`, `ssh_port`, `ssh_password` | SSH endpoint the Terraform provisioners will use. Password authentication is used for the remote exec provisioners. |
| `sudo_password` | Optional override for privilege escalation. Leave blank to reuse `ssh_password`. |
   | `project_dir` | Directory on the server where Compose files and env vars live (default `/opt/kanban-lite`). |
   | `backend_image` | Fully qualified image reference that the server should pull, for example `registry.example.com/kanban-lite-api:2024-05-24.1`. |
   | `database_url` | DSN pointing at the PostgreSQL instance that hosts the production data. |
   | `frontend_origin` | Public URL of the frontend (used for CORS in FastAPI). |
| `api_port` | Local port exposed by the backend container (default `8000`). |
| `postgres_network_name` | Optional external Docker network that already contains your Postgres container (e.g. `"firefly-net"`). Leave blank to skip attaching. |
| `registry_port` | Local port where the Docker registry listens (default `5000`). |
   | `registry_data_dir` | Persistent volume mounted into the registry container (default `/var/lib/registry`). |
   | `app_server_name`, `app_server_alias` | Canonical domain and optional alias rendered into the Apache virtual host for the frontend (e.g. `kanban-lite.example.com`). |
   | `registry_server_name` | Domain dedicated to the private registry (e.g. `registry.example.com`). |
   | `registry_basic_auth_user` | Username enforced by Apache Basic Auth when accessing the registry. |
   | `registry_basic_auth_password` | Plaintext password the deploy will use for `docker login` before pulling images (leave blank if the registry allows anonymous pulls). |
   | `registry_basic_auth_password_hash` | Hash generated via `htpasswd -nb <user> <password>`; Apache reads this value to validate pushes/pulls via HTTPS. |
   | `api_subpath` | URL prefix that proxies to the backend (default `/api`). |
   | `static_root` | Directory where the frontend bundle is deployed (default `/var/www/kanban-lite`). |
   | `frontend_dist_dir` | Override for the local dist directory if it is not `web/dist` (keep `null` to use the default). |
   | `apache_sites_available_dir`, `apache_htpasswd_dir`, `apache_log_dir` | Paths that match your Apache installation. Defaults are `/etc/apache2/sites-available`, `/etc/apache2/htpasswd`, `/var/log/apache2`. |
   | `apache_user`, `apache_group` | UID/GID that should own the static files (default `www-data`). |
   | `ssl_certificate_file`, `ssl_certificate_key_file`, `ssl_certificate_chain_file` | Certificate files already configured on the server. The chain file is optional. |

## 2. Build and publish artifacts

Run the Make targets after the variables are in place:
- `make package-backend` — builds the FastAPI image, logs into the registry (if credentials are provided), and pushes the new tag.
- `make package-frontend` — runs `npm run build` and prepares `web/dist` for upload. This target is included automatically when you run the combined deploy.
- `make deploy` — executes both package targets and then `terraform -chdir=infra apply $(TF_ARGS)`.

You can validate individual Terraform steps using the `-target` flag:
- `terraform -chdir=infra apply -target=null_resource.host_setup` (installs missing packages and prepares directories).
- `terraform -chdir=infra apply -target=null_resource.registry_stack` (provisions the private registry service and its Apache virtual host).
- `terraform -chdir=infra apply -target=null_resource.app_stack` (syncs the frontend bundle, backend compose file, and the application virtual host).

> **Tip:** If your production Postgres already runs in its own compose stack (e.g. `firefly-db` on the `firefly-net` network), set `postgres_network_name = "firefly-net"` in `infra/terraform.tfvars` and point `database_url` at the service name (for example `postgresql+psycopg://user:pass@firefly-db:5432/db`). The compose template will attach the API container to that network automatically.

`null_resource` é um tipo de recurso Terraform neutro que executa provisioners (como `remote-exec` e `file`). Aqui eles agrupam tarefas por papel: `host_setup`, `registry_stack` e `app_stack`. Não representam infraestrutura física; servem para organizar passos e permitir execuções segmentadas.
