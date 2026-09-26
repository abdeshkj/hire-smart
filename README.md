# HireSmart

HireSmart is a full-stack freelance marketplace platform designed to streamline hiring and collaboration between clients and independent talent. Built with an architecture designed for intelligent matchmaking, HireSmart combines traditional marketplace workflows (job postings, proposals, applicant management, and project tracking) with AI-driven capabilities: semantic candidate-job matching via vector embeddings, smart multi-factor re-ranking, and a RAG-powered proposal writing assistant.

The platform is being engineered in systematic phases. **Phase 1 (Infrastructure & Scaffolding)**, **Phase 2 (Core Marketplace Foundation)**, and **Phase 3 (Smart Matching Engine)** are fully implemented and verified end-to-end.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **HTTP Client**: Axios

### Backend API
- **Runtime**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- **Authentication**: Stateless JWT (`jsonwebtoken`), password hashing via `bcryptjs`
- **Security & Logging**: `helmet`, `cors`, `morgan`
- **Database Driver**: `pg` (Connection pooling via `pgPool`)
- **ML Client**: Asynchronous fire-and-forget embedding triggers and synchronous ranking client with circuit-breaker resilience

### Database & Migrations
- **Primary Relational Store**: [PostgreSQL 16](https://www.postgresql.org/) with the [`pgvector`](https://github.com/pgvector/pgvector) extension enabled
- **Indexing**: `ivfflat` vector indexes on profile, job, and skill embedding vectors
- **Schema Management**: [`node-pg-migrate`](https://salsita.github.io/node-pg-migrate/) for declarative, reversible SQL migrations
- *Note on Database Architecture*: MongoDB/Mongoose was initially scaffolded during early project setup but has been deprecated in favor of PostgreSQL as the single relational source of truth. Legacy Mongoose models are archived in `backend/src/models/_deprecated/` for reference.

### ML & AI Microservice
- **Framework**: [Python 3.11+](https://www.python.org/) & [FastAPI](https://fastapi.tiangolo.com/)
- **Server**: Uvicorn
- **Embeddings & Vector Search**: Sentence-Transformers (`all-MiniLM-L6-v2`, 384-dimensional dense vectors) for real-time profile, job, and skill embeddings, with pgvector cosine distance retrieval (`<=>`)
- **Ranking Engine**: Three-signal hybrid retrieval combining semantic similarity, max-pooled skill similarity, and lexical exact-match overlap
- **Generative AI (Phase 4)**: Google Gemini API integration for RAG-assisted proposal writing (endpoints scaffolded, pending Phase 4 integration)

---

## 📁 Project Structure

```text
hire-smart/
├── backend/                  # Express REST API application
│   ├── src/
│   │   ├── config/           # Database (pgPool), environment, and service configs
│   │   ├── controllers/      # Request handlers (auth, profile, skill, job, application)
│   │   ├── middleware/       # JWT authentication and centralized error handling
│   │   ├── models/           # Plain SQL data access models using pgPool
│   │   │   └── _deprecated/  # Legacy Mongoose schemas (deprecated)
│   │   ├── routes/           # Express sub-routers and route index
│   │   ├── services/         # ML client, JWT generation, password hashing, and business logic
│   │   ├── utils/            # ApiError class and utility functions
│   │   └── app.js            # Express app middleware configuration
│   ├── server.js             # API server entrypoint (port 5000)
│   └── package.json
├── database/                 # PostgreSQL database schemas and migrations
│   ├── migrations/           # Versioned SQL migrations (node-pg-migrate)
│   │   ├── 1715000000000_enable-pgvector.js
│   │   ├── 1715000000001_enable-pgcrypto.js
│   │   ├── 1715000000002_create-users-table.js
│   │   ├── 1715000000003_create-profiles-table.js
│   │   ├── 1715000000004_create-skills-table.js
│   │   ├── 1715000000005_create-user-skills-table.js
│   │   ├── 1715000000006_create-jobs-table.js
│   │   ├── 1715000000007_create-job-skills-table.js
│   │   ├── 1715000000008_create-applications-table.js
│   │   ├── 1715000000009_create-ratings-table.js
│   │   ├── 1715000000010_add-skills-embedding-column.js
│   │   └── 1715000000011_create-pgvector-indexes.js
│   └── package.json
├── frontend/                 # Next.js client-side web application
│   ├── src/                  # App Router components, pages, and layouts
│   ├── public/               # Static assets
│   └── package.json
├── ml-service/               # Python FastAPI microservice (port 8000)
│   ├── app/
│   │   ├── api/              # FastAPI route endpoints (embeddings, ranking, rag)
│   │   ├── core/             # Microservice configuration, settings, and DB pool
│   │   ├── models/           # Pydantic request/response schemas
│   │   ├── services/         # EmbeddingService, RAGService
│   │   └── main.py           # FastAPI application entrypoint
│   ├── requirements.txt
│   └── README.md
├── datasets/                 # Resume, job description, and benchmark evaluation data
├── docs/                     # Architecture diagrams and specifications
├── scripts/                  # Automation, deployment, and data utility scripts
├── .env.example              # Template for root environment variables
├── LICENSE                   # MIT License
├── README.md                 # Project documentation
└── ROADMAP.md                # Phase-by-phase implementation tracker
```

---

## ✨ Features Implemented

### Core Marketplace (Phase 1 & Phase 2)

- **Authentication & RBAC**:
  - Registration, login, and token issuance with role claims (`freelancer`, `client`, `admin`).
  - Bcrypt password hashing and uniform error handling against user enumeration.
  - JWT authorization middleware protecting sensitive routes.
- **User Profiles**:
  - Unified `profiles` table with role-aware validation.
  - Freelancers manage full name, bio, experience level (`entry`, `intermediate`, `expert`), years of experience, and portfolio links.
  - Clients manage company name, industry, and organizational description.
- **Normalized Skills Catalog**:
  - Global `skills` table with idempotent upserts (`ON CONFLICT (name) DO UPDATE`).
  - Many-to-many associations via `user_skills` (with proficiency levels: `beginner`, `intermediate`, `advanced`, `expert`) and `job_skills`.
- **Job Posting & Browsing**:
  - Client-only job creation with title, description, budget, experience requirements, and tagged skills.
  - Reverse-chronological open job browsing with pagination metadata (`page`, `limit`, `total`, `totalPages`).
  - Query-level ownership enforcement for job status changes (`open`, `closed`, `filled`).
- **Application Management**:
  - Freelancers can apply to open jobs with customized proposals.
  - Duplicate applications prevented via PostgreSQL composite unique constraint (`UNIQUE(job_id, freelancer_id)`), returning standard `409 Conflict`.
  - Freelancer application withdrawal (allowed only while in `pending` status).
  - Client applicant review with joined freelancer contact details, plus status transitions (`shortlisted`, `accepted`, `rejected`).

### AI-Powered Matching (Phase 3)

- **Real-time Vector Embedding Generation**:
  - Profile, job, and skill embeddings generated using Sentence-Transformers (`all-MiniLM-L6-v2`, 384 dimensions).
  - Automatically triggered upon profile, job, and skill updates via asynchronous, fire-and-forget HTTP calls from the backend without blocking user-facing responses.
- **Hybrid Three-Signal Candidate & Job Ranking**:
  - **Semantic Similarity**: Cosine distance via pgvector `<=>` operator between profile and job vectors.
  - **Max-Pooled Skill Similarity**: Per-skill similarity comparison avoiding the dilution problem of whole-profile embeddings on jargon-dense text.
  - **Lexical Overlap**: Exact keyword match ratio providing anchor precision.
  - **Weighted Composite Score**: Balanced 0.4 semantic + 0.4 skill overlap + 0.2 lexical score.
- **Explainable Ranking Output**:
  - Candidate and job recommendations include a normalized 0–100 `fitScore` alongside human-readable explainability reasons (e.g., `"✓ Your skills strongly match this job's requirements"`, `"✓ Above-average budget for this type of work"`, `"✓ Strong profile alignment"`).
- **Bidirectional Matching**:
  - **Client-to-Candidate**: Clients view ranked, explained candidate matches for their posted jobs (`GET /api/jobs/:jobId/candidates`).
  - **Freelancer-to-Job**: Freelancers view personalized recommended jobs ranked by fit (`GET /api/jobs/recommended`).
- **Resilient Microservice Architecture**:
  - The ML service can go down without breaking core marketplace functionality: embedding triggers fail safely in the background, and synchronous ranking calls degrade to a clean HTTP 503 (`"Matching service temporarily unavailable"`) with a 10-second timeout rather than hanging or crashing the backend.

---

## 🔮 Planned Features (Phase 4 – Phase 6)

- **Phase 4 — Applications & AI Proposal Assistant**:
  - Complete application submission UI.
  - RAG-powered proposal writing assistant leveraging the Google Gemini API to draft contextual, skill-aligned cover letters.
- **Phase 5 — Project Workspace & Collaboration**:
  - Active contract workspaces with Kanban milestone boards.
  - File deliverables and escrow/payment simulation.
  - Mutual rating and review system.
- **Phase 6 — Research Evaluation & Benchmarking**:
  - Performance comparisons against baseline matching algorithms (BM25, TF-IDF).
  - Evaluation of precision@k, recall@k, and NDCG on benchmark datasets.

*For complete details, milestones, and status, see [ROADMAP.md](ROADMAP.md).*

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher & `npm`
- **Python**: v3.11 or higher
- **PostgreSQL**: v16 with the `pgvector` extension installed
- **Git**

---

### 1. Repository Setup & Environment Variables

Clone the repository and prepare environment files:

```bash
git clone https://github.com/<your-username>/hire-smart.git
cd hire-smart
```

Copy the respective `.env.example` templates to `.env`:
- `cp .env.example .env` (Root)
- Configure `backend/.env` with your PostgreSQL credentials (`DATABASE_URL`, `JWT_SECRET`, `PORT=5000`, `ML_SERVICE_URL=http://localhost:8000`).
- Configure `database/.env` with migration database credentials (`DATABASE_URL`).
- Configure `ml-service/.env` with `DATABASE_URL`, `PORT=8000`, and `GEMINI_API_KEY`.
- Configure `frontend/.env.local` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`.

---

### 2. Database Setup & Migrations

Ensure PostgreSQL is running locally, create the database, and execute the migrations:

```bash
# Create the database in PostgreSQL
createdb -U postgres hiresmart_dev

# Run all migrations up to current version (including pgvector indexes)
cd database
npm install
npm run migrate:up
```

---

### 3. Backend API Service

In a new terminal window:

```bash
cd backend
npm install
npm run dev
```

- **Base URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

---

### 4. ML / AI Microservice

In a new terminal window:

```bash
cd ml-service

# Create and activate virtual environment
python -m venv venv

# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

- **Base URL**: `http://localhost:8000`
- **Health Check**: `http://localhost:8000/health`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

---

### 5. Frontend Client Application

In a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

- **Web Application**: `http://localhost:3000`

---

## 📡 API Overview

The backend provides structured REST endpoints under the `/api` prefix:

| Endpoint Group | Primary Responsibility |
| :--- | :--- |
| **`/api/auth`** | User registration, authentication, login/logout, JWT token issuance |
| **`/api/profiles`** | Freelancer and client profile creation, updates, and public profile lookups (triggers async profile embeddings) |
| **`/api/skills`** | Global skill catalog exploration and user-skill proficiency management (triggers async skill embeddings) |
| **`/api/jobs`** | Job posting (triggers async job embeddings), status lifecycle (`open`, `closed`, `filled`), open job browsing with pagination, AI candidate ranking for clients (`GET /api/jobs/:jobId/candidates`), and AI job recommendations for freelancers (`GET /api/jobs/recommended`) |
| **`/api/applications`** | Job application submission, freelancer application tracking, client applicant review, and status transitions |

---

## 🗺️ Development Roadmap

HireSmart is developed against a structured milestone plan. For task breakdowns, checkpoint verification criteria, and live progress, see:

👉 [ROADMAP.md](ROADMAP.md)

---

## 🌿 Contributing & Branch Strategy

The repository follows a phased feature-branching workflow:
- **`main`**: Represents stable, production-ready code verified by completed checkpoints.
- **`phase/<N>-<name>`** / **`feature/<name>`**: Dedicated development branches for each architectural phase (e.g., `phase/2-foundation`, `feature/phase3-ai-matching`).
- Code is only merged back into `main` after all validation tests and checkpoint criteria for that phase have passed and been verified.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
