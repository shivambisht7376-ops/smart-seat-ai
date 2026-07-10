# SmartSeat AI 🏢

> **Enterprise Seat Allocation & Project Mapping Platform**  
> Intelligent workforce management for 5,000+ employees

[![Backend CI](https://github.com/your-org/smartseat-ai/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/your-org/smartseat-ai/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/your-org/smartseat-ai/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/your-org/smartseat-ai/actions/workflows/frontend-ci.yml)

---

## Overview

SmartSeat AI is a production-ready, full-stack enterprise application that manages:

| Module | Capability |
|--------|-----------|
| 👥 **Employee Management** | Directory, profiles, bulk import, CRUD |
| 📋 **Project Mapping** | Employee ↔ project assignments with % allocation |
| 🪑 **Seat Allocation** | Allocate, transfer, release, bulk assign |
| 🆕 **New Joiner Queue** | Auto seat recommendation for new hires |
| 🗺️ **Floor Management** | Building → Floor → Zone → Seat hierarchy |
| 📊 **Analytics Dashboard** | KPIs, utilization trends, Recharts |
| 🤖 **AI Assistant** | Natural language queries (mock + OpenAI) |
| 📜 **Audit Logs** | Complete change history with JSONB diff |
| 🔐 **RBAC** | 4 roles: Super Admin, HR Admin, PM, Employee |

---

## Tech Stack

### Frontend
- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** + **Shadcn UI** components
- **TanStack Table v8** for data grids
- **Recharts** for analytics charts
- **React Hook Form** + **Zod** validation
- **Zustand** for state management
- **TanStack Query** for server state

### Backend
- **FastAPI** + **Python 3.12**
- **SQLAlchemy 2.0** (async) + **asyncpg**
- **Pydantic v2** + **Alembic** migrations
- **JWT** auth + refresh tokens
- **SlowAPI** rate limiting

### Database
- **PostgreSQL** (Neon cloud) — 17 tables
- Partial unique indexes, JSONB, soft deletes

### DevOps
- **Docker** + **docker-compose**
- **GitHub Actions** CI/CD
- **Vercel** (frontend) + **Railway** (backend)

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker & Docker Compose
- Neon PostgreSQL account (free tier)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/smartseat-ai.git
cd smartseat-ai
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL (Neon) and SECRET_KEY

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL

npm install
npm run dev
```

### 4. Using Docker (Recommended for local)

```bash
# From repo root
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

### 5. Seed Data

```bash
cd backend
python scripts/seed_data.py
# Loads: 5000 employees, 150 projects, 4 buildings, 20 floors, 10000 seats
```

---

## Project Structure

```
smartseat-ai/
├── frontend/          # Next.js 15 App
├── backend/           # FastAPI App
├── database/          # SQL schema + migrations
├── docs/              # Architecture docs
├── .github/workflows/ # CI/CD pipelines
└── docker-compose.yml
```

See [INSTALLATION.md](./INSTALLATION.md) for detailed setup.  
See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system design.  
See [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) for API reference.

---

## User Roles

| Role | Access |
|------|--------|
| **Super Admin** | Full system access, settings, audit logs |
| **HR Admin** | Employee management, onboarding, projects |
| **Project Manager** | Team allocation, project analytics |
| **Employee** | Self-service: view seat, project, profile |

---

## Default Login (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@smartseat.ai` | `Admin@123` |
| HR Admin | `hr@smartseat.ai` | `Admin@123` |
| Project Manager | `pm@smartseat.ai` | `Admin@123` |
| Employee | `employee@smartseat.ai` | `Admin@123` |

---

## License

MIT License — © 2026 SmartSeat AI
