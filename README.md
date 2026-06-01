# 🏙️ Mardan Smart City – Citizen Complaint Portal

A fully modernized, **Cloud-Native** web application that allows citizens of Mardan to submit, track, and manage civic complaints. 

This repository contains the complete implementation for the DESC Digital Innovation Center RFP (Tender Reference Number: DESC-MRD-2026-CNC-088).

---

## 🌟 Cloud-Native Architecture

This project has been completely refactored from a monolithic setup to a scalable, cloud-native orchestration pipeline featuring:

- **React + Vite Frontend:** Modern, tabbed SPA with professional Lucide icons and dark-mode styling.
- **Node.js + Express Backend:** RESTful API with stateless JWT authentication.
- **PostgreSQL + Redis:** Stateful data persistence and fast in-memory caching.
- **Docker Containerization:** Full `docker-compose` orchestration for local multi-container development.
- **Kubernetes (K3s):** Production-ready YAML manifests (`Deployment`, `Service`, `StatefulSet`, `PVC`, `ConfigMap`, `Secret`) for seamless deployment.
- **Infrastructure as Code (Terraform):** Automated cloud provisioning for AWS/GCP (VPC, EKS, RDS).
- **CI/CD (GitHub Actions):** Automated builds, linting, testing, and Vercel/Render deployments.

---

## 🚀 Getting Started Locally (Docker)

The absolute fastest way to run the entire architecture (Frontend, Backend, Postgres, Redis) is via Docker Compose.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.

### 1. Spin Up the Environment
```bash
docker-compose up -d --build
```

This single command builds and starts:
- `mardan-postgres` (Port 5432)
- `mardan-redis` (Port 6379)
- `mardan-backend` (Port 5000)
- `mardan-frontend` (Port 3000)

### 2. Access the Application
- **Frontend Portal:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000`

---

## 🏗️ Project Structure

```text
|-- .github/                # CI/CD Workflows (build, test, deploy)
|-- backend/                # Node.js API + Dockerfile
|-- database/               # SQL Schemas and Seeds
|-- frontend/               # React Vite UI + Dockerfile
|-- k3s/                    # Kubernetes Manifests
|-- terraform/              # Infrastructure as Code (AWS/GCP)
|-- docker-compose.yml      # Local Orchestration
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 6, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express 4, Sequelize ORM |
| **Database** | PostgreSQL 15, Redis (Caching) |
| **Containers**| Docker, Docker Compose |
| **Orchestration**| Kubernetes (K3s) |
| **IaC** | Terraform |
| **CI/CD** | GitHub Actions |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |

---

## 🏗️ Complaint Flow

1. Citizen **registers/logs in** → receives JWT.
2. Submits a complaint → gets a unique **MSC-XXXXXX** tracking ID.
3. System utilizes **Redis** for fast token validation and caching.
4. Admin updates status: `pending → in_progress → resolved`.
5. Citizen (or anyone) tracks complaint status publicly using tracking ID.

---

## 📝 RFP Submission Progress

- [x] Docker Containerization
- [x] Local Orchestration (Docker Compose)
- [x] Kubernetes Manifests (K3s)
- [x] CI/CD Pipeline (GitHub Actions)
- [x] Infrastructure as Code (Terraform)
- [x] Stateful Data Separation (Postgres/Redis)
- [ ] **Prometheus & Grafana (Monitoring)** 
- [ ] **Technical & Financial Proposals (Envelope A & B)**

---

*© 2026 DESC Digital Innovation Center, Mardan. All rights reserved.*
