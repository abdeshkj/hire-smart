# HireSmart

HireSmart is an AI-powered hiring and recruitment platform designed to streamline candidate screening, automate resume parsing, evaluate skill relevance, and facilitate intelligent interview matching.

---

## 📁 Project Structure

```text
hire-smart/
├── frontend/       # Client-side web application (UI components, pages, client assets)
├── backend/        # Server-side API application (auth, business logic, endpoints)
├── ml-service/     # AI/ML microservice (resume parsing, matching models, NLP pipelines)
├── database/       # Database schemas, migrations, seed data, and query scripts
├── datasets/       # Training, testing, and benchmark datasets for ML models
├── scripts/        # Utility scripts, automated setup, deployment, and maintenance tasks
├── docs/           # Architecture diagrams, API documentation, and specifications
├── .gitignore      # Git ignore rules for node, python, and environment files
├── .env.example    # Template for required environment variables
└── README.md       # Project overview and setup instructions
```

---

## 🚀 Getting Started

Follow the instructions below to set up each component locally.

### Prerequisites
- **Node.js**: v18+ and npm / yarn / pnpm
- **Python**: v3.10+
- **Database**: PostgreSQL / MongoDB (depending on configuration)
- **Git**

---

### 1. Environment Setup
Copy the example environment file and configure your values:
```bash
cp .env.example .env
```

---

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend application will be running at `http://localhost:3000` (or configured port).

---

### 3. Backend Setup
```bash
cd backend
npm install       # Or for Python: pip install -r requirements.txt
npm run dev       # Or python app.py
```
The backend API server will be available at `http://localhost:5000`.

---

### 4. ML Service Setup
```bash
cd ml-service
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python main.py
```
The ML microservice will be running at `http://localhost:8000`.

---

## 📄 License
This project is licensed under the MIT License.
