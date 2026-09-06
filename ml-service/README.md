# HireSmart — ML & AI Microservice

This microservice handles **all machine learning, AI, and vector operations** for the HireSmart platform.

---

## 🏛️ Architectural Principles

- **Separation of Concerns**:
  - The **Node.js/Express Backend** (`backend/`) handles application business logic, user authentication, session management, database CRUD, and routing.
  - The **Python FastAPI ML Service** (`ml-service/`) handles computationally intensive ML operations:
    - Text embedding generation
    - Semantic vector similarity & indexing
    - Multi-factor candidate resume ranking & skill alignment
    - RAG (Retrieval-Augmented Generation) document search
    - Google Gemini LLM interaction & prompt orchestration

---

## 🚀 Setup & Local Development

### 1. Prerequisites
- Python 3.11+
- Git

---

### 2. Create and Activate Virtual Environment

From within the `ml-service/` directory:

```bash
# Create virtual environment
python -m venv venv

# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# On Windows (Command Prompt):
venv\Scripts\activate.bat

# On macOS/Linux:
source venv/bin/activate
```

---

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Set your configuration values inside `.env` (e.g., `GEMINI_API_KEY`, `ML_SERVICE_PORT`).

---

### 5. Run the Microservice

```bash
uvicorn app.main:app --reload --port 8000
```

- **Health Check Endpoint**: `http://localhost:8000/health`
- **Interactive OpenAPI Docs (Swagger)**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health and runtime status |
| `POST` | `/embeddings/generate` | Generate dense vector embeddings for texts |
| `POST` | `/ranking/candidates` | Rank candidate profiles against a job description |
| `POST` | `/rag/retrieve` | Semantic vector search and context retrieval |
