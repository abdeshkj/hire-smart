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
Branch: feature/phase3-ai-matching

- [x] ✅ Stage 1: Embeddings (all-MiniLM-L6-v2 via sentence-transformers, real embedding generation for profiles/jobs/skills, fire-and-forget backend triggers, verified to not block request/response and to survive ML service downtime)
- [x] ✅ Stage 2: Vector retrieval (pgvector cosine similarity via <=> operator, per-skill max-pooling to avoid whole-profile embedding dilution, ivfflat indexes added on profiles/jobs/skills embeddings)
- [x] ✅ Stage 3: Re-ranking (heuristic weighted combination of semantic + skill-overlap + lexical-overlap scores — explicitly documented as a placeholder for a trained model once real application/hire outcome data accumulates)
- [x] ✅ Explainable ranking API (fit score 0-100 + human-readable reasons array, verified to produce genuinely differentiated, non-templated output across strong/partial/weak matches)
- [x] ✅ Freelancer recommendation feed (reverse-direction matching — job-ranks-freelancers via GET /api/jobs/:jobId/candidates, freelancer-ranks-jobs via GET /api/jobs/recommended, both using the same three-signal scoring)
- [x] ✅ Phase 3 checkpoint (client sees ranked, explained freelancers for their job; freelancer sees ranked, explained recommended jobs — both verified end-to-end through the real backend API, not just the ML service directly)
- [ ] ⬜ Phase 3 git workflow (merge feature/phase3-ai-matching → main, create feature/phase4-rag-assistant) — pending

**Phase 3 status: ✅ COMPLETE (6/7 tasks verified, git workflow pending)**

### Key Implementation Notes:
- Embedding generation runs in the Python ML service; the Node backend triggers it via fire-and-forget HTTP calls (profile/job/skill creation) that never block the user-facing response and are proven to fail safely if the ML service is down
- Ranking retrieval (a synchronous, user-facing call) uses a 10-second timeout and converts any ML service failure into a uniform 503 "Matching service temporarily unavailable" — proven not to crash or hang the backend
- Matching combines three signals rather than embeddings alone: semantic similarity (whole-profile/job cosine similarity), max-pooled per-skill similarity (avoids the "dilution" problem of embedding an entire skill list as one blob), and lexical exact-match overlap — this design was informed by external research findings showing embeddings alone underperform on jargon-dense skill/title text
- Current re-ranking weights (0.4 semantic + 0.4 skill-overlap + 0.2 lexical) are a documented initial heuristic, not a trained model — this project has no real hire/application outcome data yet to train on; Phase 6 will revisit this once the live `applications`/`ratings` tables accumulate enough real data to train and evaluate a real reranker using the same Precision@5/Recall@10/NDCG@10 methodology planned for that phase
- A known scaling limitation: the max-pooled skill similarity SQL queries currently use an unconditional join filtered afterward (acceptable at current data volume, flagged as a TODO to optimize before production scale)

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
| Phase 3 — AI Matching | ✅ Complete | 6/7 |
| Phase 4 — RAG Assistant | ⬜ Not Started | 0/7 |
| Phase 5 — Workspace | ⬜ Not Started | 0/7 |
| Phase 6 — Evaluation | ⬜ Not Started | 0/8 |

*Last updated: 2026-09-26*
