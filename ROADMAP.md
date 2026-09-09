# HireSmart — Project Roadmap

A living checklist tracking progress through all development phases. Update the checkboxes as tasks are completed and verified (not just started).

Legend: ✅ Complete & Verified | 🚧 In Progress | ⬜ Not Started

---

## Phase 1 — Infrastructure & Scaffolding
Branch: main

- [x] ✅ Repository setup (folder structure, .gitignore, README, LICENSE)
- [x] ✅ Backend initialization (Express, JWT foundation, routing, middleware, error handling)
- [x] ✅ ML microservice initialization (FastAPI, venv, stubbed endpoints, Gemini client scaffold)
- [x] ✅ PostgreSQL + pgvector setup (local install, extension enabled, migration tooling)
- [x] ✅ Frontend initialization (Next.js App Router, Tailwind, verified backend connectivity)
- [x] ✅ Environment configuration (consolidated root .env.example, zero secrets in git history)
- [x] ✅ Phase 1 testing checkpoint (all 3 services running concurrently, verified end-to-end)
- [x] ✅ Phase 1 git workflow (committed and pushed to main)

**Phase 1 status: ✅ COMPLETE**

---

## Phase 2 — Core Job Portal & User Profiles
Branch: phase/2-foundation

- [x] ✅ Database schema (users, profiles, skills, user_skills, jobs, job_skills, applications, ratings — migrated, verified with \d output, rollback tested)
- [x] ✅ Authentication (register, login, logout, JWT, protected routes — verified with 10 live test cases including uniform 401 messages for invalid login attempts)
- [ ] ⬜ Freelancer profiles (name, bio, skills, experience, portfolio links, description)
- [ ] ⬜ Client profiles (name/company, description, industry)
- [ ] ⬜ Skills system (normalized skills table + user_skills/job_skills relationships wired into API)
- [ ] ⬜ Job posting (create job with title, description, budget, required skills, experience)
- [ ] ⬜ Job browsing (list all open jobs, no AI ranking yet)
- [ ] ⬜ Applications (basic storage — schema exists, API/UI pending)
- [ ] ⬜ Research dataset preparation (download, clean, map public resume/job datasets)
- [ ] ⬜ Phase 2 checkpoint (client creates job, freelancer creates profile + browses job, verified in DB)
- [ ] ⬜ Phase 2 git workflow (merge phase/2-foundation → main, create feature/phase3-ai-matching)

**Phase 2 status: 🚧 IN PROGRESS (2/9 tasks complete)**

---

## Phase 3 — Smart Matching Engine
Branch: feature/phase3-ai-matching (not yet created)

- [ ] ⬜ Stage 1: Embeddings (all-MiniLM-L6-v2, generate job & freelancer embeddings)
- [ ] ⬜ Stage 2: Vector retrieval (pgvector cosine similarity search, top 50)
- [ ] ⬜ Stage 3: Re-ranking (feature extraction + Logistic Regression baseline)
- [ ] ⬜ Explainable ranking API (fit score + reasons)
- [ ] ⬜ Freelancer recommendation feed (reverse matching — jobs recommended to freelancers)
- [ ] ⬜ Phase 3 checkpoint (client sees ranked freelancers, freelancer sees recommended jobs)
- [ ] ⬜ Phase 3 git workflow

**Phase 3 status: ⬜ NOT STARTED**

---

## Phase 4 — Applications & RAG Writing Assistant
Branch: feature/phase4-rag-assistant (not yet created)

- [ ] ⬜ Application system (apply, write proposal, submit)
- [ ] ⬜ Application status workflow (pending/shortlisted/accepted/rejected/withdrawn)
- [ ] ⬜ RAG dataset (successful_proposals table + embeddings)
- [ ] ⬜ RAG retrieval (vector search for similar successful proposals)
- [ ] ⬜ Gemini integration (generate improved proposal from job + draft + retrieved examples)
- [ ] ⬜ "Improve with AI" UI feature
- [ ] ⬜ Phase 4 checkpoint (full apply → AI improve → client review → accept workflow)
- [ ] ⬜ Phase 4 git workflow

**Phase 4 status: ⬜ NOT STARTED**

---

## Phase 5 — Project Workspace & Collaboration
Branch: feature/phase5-workspace (not yet created)

- [ ] ⬜ Automatic project creation on application acceptance
- [ ] ⬜ Kanban board (To Do / In Progress / Done, task CRUD)
- [ ] ⬜ AWS S3 file storage (upload, metadata storage)
- [ ] ⬜ Project completion workflow
- [ ] ⬜ Rating system (client↔freelancer, 1-5 stars + feedback)
- [ ] ⬜ Feedback loop wired into ranking model inputs
- [ ] ⬜ Phase 5 checkpoint
- [ ] ⬜ Phase 5 git workflow

**Phase 5 status: ⬜ NOT STARTED**

---

## Phase 6 — Research Evaluation & Final Polish
Branch: feature/phase6-evaluation (not yet created)

- [ ] ⬜ Experiment 1: Keyword/TF-IDF baseline
- [ ] ⬜ Experiment 2: Embedding-only baseline
- [ ] ⬜ Experiment 3: Full proposed pipeline
- [ ] ⬜ Controlled evaluation (Precision@5, Recall@10, NDCG@10, MRR)
- [ ] ⬜ Ablation analysis
- [ ] ⬜ Reproducibility scripts (scripts/prepare_dataset.py, generate_embeddings.py, etc.)
- [ ] ⬜ Final UI polish
- [ ] ⬜ Final end-to-end testing (both client and freelancer full journeys)
- [ ] ⬜ Phase 6 git workflow + v1.0.0 tag

**Phase 6 status: ⬜ NOT STARTED**

---

## Overall Progress

| Phase | Status | Tasks Complete |
|---|---|---|
| Phase 1 — Infrastructure | ✅ Complete | 8/8 |
| Phase 2 — Core Marketplace | 🚧 In Progress | 2/9 |
| Phase 3 — AI Matching | ⬜ Not Started | 0/6 |
| Phase 4 — RAG Assistant | ⬜ Not Started | 0/7 |
| Phase 5 — Workspace | ⬜ Not Started | 0/7 |
| Phase 6 — Evaluation | ⬜ Not Started | 0/8 |

*Last updated: 2026-09-07*
