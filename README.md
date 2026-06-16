# HealthQ — AI-Powered Smart Prescription & Lab Report Intelligence Portal

HealthQ is a production-ready, full-stack medical intelligence platform designed to improve healthcare accessibility, translation, and medication safety awareness. It helps patients decipher handwritten prescriptions, translate clinical lab parameters (blood sugar, thyroid panel, lipids, BP) into plain text explanations, verify drug interactions, check allergen warnings, and get personalized dietary advice.

> [!WARNING]
> **Clinical Disclaimer**: HealthQ is an educational portal designed to improve accessibility and health literacy. It **must not replace** medical doctors, professional diagnosis, treatment regimens, or clinical evaluations.

---

## Technical Innovation & Modules

1. **Smart Prescription OCR**: Scans handwritten and printed prescriptions using multimodal Gemini API vision or offline Tesseract/EasyOCR fallback models.
2. **Prescription Clarity Score**: Evaluates the safety of the slip (0-100) by detecting missing dosages, duration, or ambiguous instruction strings.
3. **Medical Report Interpreter**: Extracts values from thyroid panels, lipid profile markers, and blood glucose, mapping ranges to 🟢 Normal, 🟡 Needs Attention, or 🔴 Follow-up indicators.
4. **Drug Interaction Engine**: Analyzes combinations of multiple medications to evaluate high-risk clinical contraindications.
5. **Allergy & Safety Alerts**: Audits prescribed medications against a patient's custom allergy profile (e.g. flagging penicillin ingredients).
6. **Food Recommendation Engine**: Generates dietary schedules (what to eat/avoid, timing relative to meds).
7. **Voice-First Accessibility**: Built-in speech synthesis (TTS) player allowing patients to listen to clinical explanations and timings.

---

## Folder Architecture

```
HealthQ/
├── backend/
│   ├── app/
│   │   ├── routers/            # Endpoint routes (Auth, Prescriptions, Reports, Profile, Interactions)
│   │   ├── config.py           # Configuration environment loaders
│   │   ├── database.py         # SQLAlchemy engine and sessions
│   │   ├── models.py           # SQLAlchemy database tables
│   │   ├── schemas.py          # Pydantic validation schemas
│   │   ├── auth_helpers.py     # Password hashing & JWT verification
│   │   ├── ocr_service.py      # Image cleaning and OCR wrapper
│   │   └── ai_service.py       # Gemini API prompts and schemas
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js pages (Login, Dashboard, Scanner, Report Analyzer, History)
│   │   ├── components/         # Common layouts (Sidebar, Speech Assistant)
│   │   ├── context/            # AuthContext provider
│   │   └── lib/                # API client connection wrapper
│   ├── package.json
│   └── tailwind.config.ts
└── README.md
```

---

## Step-by-Step Setup Guide

### 1. Backend Setup (FastAPI)

Prerequisites: Python 3.10+ and `py` launcher.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   py -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your environment file:
   - Copy `.env.example` to `.env`
   - Paste your **Gemini API Key** in `GEMINI_API_KEY` (Required for AI features. If omitted, the server runs in rule-based offline fallback mode).
5. Launch the backend API server:
   ```bash
   python -m app.main
   ```
   *The Swagger UI documentation is available at `http://localhost:8000/docs`.*

### 2. Frontend Setup (Next.js)

Prerequisites: Node.js v18+ and npm.

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Boot the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser and visit:
   `http://localhost:3000`

---

## Production Deployment Instructions

### Database Configuration
For development, the system runs on a local SQLite database (`healthq.db`). To transition to production, configure your PostgreSQL connection string in `.env`:
```env
DATABASE_URL=postgresql://user:password@host:5400/healthq
```

### Dockerized Deployment (Recommended)
You can containerize both modules for deployment to AWS ECS, Heroku, or GCP Cloud Run.

#### Backend Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```
