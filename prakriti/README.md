# PRAKRITI – AI Disaster Intelligence & Response System

> **Post-disaster information fog elimination through evidence fusion, contradiction detection, and explainable AI rescue prioritization.**

⚠️ **This is a hackathon demo application.** All data is fictional and clearly marked as DEMO. Village names, population numbers, and incident data are simulated for demonstration purposes only.

---

## What PRAKRITI Does

During the first 24 hours after a large-scale disaster, district authorities face an **information fog** — fragmented, contradictory, unverified data arriving from dozens of sources simultaneously.

PRAKRITI converts this chaos into actionable intelligence:

| Input | → | PRAKRITI Output |
|-------|---|-----------------|
| Fragmented citizen/official reports | → | Unified incident picture per village |
| Contradictory claims | → | Contradiction radar with weighted resolution |
| Unclear situation | → | Information Fog Score (0–100%) |
| Multiple evidence sources | → | Evidence Fusion Confidence Score |
| Population + damage data | → | Rescue Priority Score (P1–P4) |
| Limited resources | → | AI Resource Allocation Recommendations |
| Inaccessible roads | → | Route Intelligence |
| Silence from remote areas | → | Communication Blackout Alerts |

---

## Core Features

### 9 Unique Features

1. **Information Fog Score** – Quantifies uncertainty for every location (0-100%)
2. **Evidence Fusion Engine** – Combines satellite, official, police, citizen, social media with weighted trust
3. **Contradiction Radar** – Detects conflicting reports, flags them, recommends resolution
4. **Before/After Comparison** – Visual change detection for pre/post disaster imagery
5. **Dynamic Rescue Priority Score** – Transparent formula: Damage × Population × Isolation × Urgency × Medical × Confidence
6. **"Why This Village First?"** – Explainable AI panel for every priority decision
7. **Resource What-If Simulator** – Test allocation decisions before deploying
8. **Last-Mile Accessibility Score** – Road/flood/bridge analysis per village
9. **Silence Is A Signal** – Information blackout detection — no reports ≠ safe

---

## Tech Stack

### Backend
- **Python 3.11+** + **FastAPI**
- **SQLite** (default) / **PostgreSQL** (optional)
- **SQLAlchemy** async ORM
- AI modules: scoring engine, contradiction detector, damage assessment (demo simulation layer)

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS** (dark command-center theme)
- **Leaflet/OpenStreetMap** (interactive disaster map)
- **Recharts** (analytics charts)
- **Lucide React** icons

### AI Architecture
- Modular design — real YOLO/SAR models can be plugged in
- Default: `AI_MODE=demo` (realistic simulation layer)
- Set `AI_MODE=real` when actual model weights are available

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Clone and Setup Backend

```bash
cd prakriti/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env       # Windows
# cp .env.example .env       # Linux/Mac

# Start the server
uvicorn app.main:app --reload --port 8000
```

The backend will:
1. Create a SQLite database (`prakriti.db`)
2. Load all demo data automatically
3. Be available at `http://localhost:8000`
4. API docs at `http://localhost:8000/docs`

### 2. Setup Frontend

```bash
cd prakriti/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## Using the Application

### Dashboard
- Open `http://localhost:3000`
- View key metrics: affected villages, people at risk, blocked roads
- See priority ranking of villages by AI rescue score
- Monitor live activity feed

### Live Map
- Click any village marker for detailed panel
- Filter by severity (Critical/High/Moderate/Low)
- Toggle road network (open/blocked/flooded)
- Click "WHY THIS VILLAGE FIRST?" for AI explanation

### Run the Simulation
1. Go to **Simulation** page
2. Click **"RUN DISASTER SIMULATION"**
3. Watch all 12 steps execute progressively
4. Return to Dashboard/Map to see updated results

### Submit a Report
1. Go to **Reports** page
2. Click "Submit Report"
3. Fill in village, type, description, severity
4. System automatically checks for duplicates and contradictions

### Resource What-If Simulator
1. Go to **Resource Allocation** → **What-If Simulator** tab
2. Select a resource and target village
3. See impact analysis before deploying

### AI Damage Assessment
1. Go to **AI Assessment** page
2. Upload any satellite/drone/ground photo
3. Get damage classification and recommendations
4. Use Before/After tab for change detection

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Key metrics |
| GET | `/api/dashboard/activity` | Activity feed |
| GET | `/api/dashboard/alerts` | Active alerts |
| GET | `/api/dashboard/analytics` | Charts data |
| GET | `/api/villages` | All villages with incidents |
| GET | `/api/villages/{id}` | Village detail + reports + timeline |
| GET | `/api/villages/{id}/why-first` | Explainable AI priority |
| GET | `/api/reports` | All reports |
| POST | `/api/reports` | Submit new report |
| GET | `/api/reports/contradictions` | Contradiction list |
| GET | `/api/resources` | All resources |
| GET | `/api/resources/recommendations` | AI allocation recommendations |
| POST | `/api/resources/{id}/deploy` | Deploy resource |
| POST | `/api/resources/simulate-whatif` | What-if analysis |
| GET | `/api/routes` | Road network |
| POST | `/api/ai/assess-damage` | Image damage assessment |
| POST | `/api/ai/compare-before-after` | Before/after comparison |
| POST | `/api/simulation/start` | Start simulation |
| GET | `/api/simulation/status` | Simulation progress |
| POST | `/api/simulation/reset` | Reset demo data |

---

## Project Structure

```
prakriti/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Settings from .env
│   │   ├── database.py          # SQLAlchemy async engine
│   │   ├── models.py            # DB models
│   │   ├── api/
│   │   │   ├── dashboard.py     # Dashboard endpoints
│   │   │   ├── villages.py      # Village/incident endpoints
│   │   │   ├── reports.py       # Report submission/listing
│   │   │   ├── resources.py     # Resource management + routes
│   │   │   ├── ai_analysis.py   # Image assessment endpoints
│   │   │   └── simulation.py    # Simulation control
│   │   ├── ai/
│   │   │   ├── scoring.py       # Fog, Confidence, Priority, Accessibility
│   │   │   ├── contradiction.py # Contradiction + duplicate detection
│   │   │   └── damage_assessment.py  # Image analysis (demo + real)
│   │   └── services/
│   │       ├── seeder.py        # Demo data seeder
│   │       └── simulation.py    # Simulation engine
│   ├── data/
│   │   └── demo_data.py         # 15 villages, 27+ reports, resources, roads
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Router + sidebar layout
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # EOC command center
│   │   │   ├── MapPage.jsx      # Full Leaflet map
│   │   │   ├── ReportsPage.jsx  # Reports + submission form
│   │   │   ├── ContradictionRadar.jsx
│   │   │   ├── ResourceAllocation.jsx
│   │   │   ├── AIDamageAssessment.jsx
│   │   │   ├── Analytics.jsx    # Charts + intelligence
│   │   │   └── SimulationPage.jsx
│   │   ├── components/
│   │   │   ├── DisasterMap.jsx  # Leaflet map + markers + panel
│   │   │   ├── ActivityFeed.jsx
│   │   │   └── SharedComponents.jsx  # Badges, bars, cards
│   │   ├── hooks/useApi.js
│   │   ├── services/api.js      # Axios API client
│   │   └── utils/helpers.js     # Constants + formatters
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## Demo Data

The demo uses a fictional district called **Suvarnapur** with:

- **15 villages** across 5 administrative blocks
- **27+ incident reports** from citizens, police, officials, satellite, sensors
- **2 contradiction pairs** (conflicting severity claims)
- **14 rescue resources** (boats, ambulances, medical teams, excavators)
- **10 road segments** (blocked, flooded, damaged, open)
- Pre-seeded Information Fog, Confidence, Priority, Accessibility scores

---

## Extending to Real Data

### Connect to PostgreSQL
```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/prakriti
```

### Enable Real AI Models
```env
AI_MODE=real
```
Then implement model loading in [`backend/app/ai/damage_assessment.py`](backend/app/ai/damage_assessment.py) — the `_real_inference()` function is the integration point.

### Real Population Data
Replace the `population` field in `VILLAGES` in [`backend/data/demo_data.py`](backend/data/demo_data.py) with Census API data.

---

## Key Design Decisions

1. **Modular AI architecture** — scoring, contradiction, and damage modules are independent
2. **Transparent scoring** — every score has a human-readable explanation
3. **Demo ≠ Real** — all simulated data is clearly labelled, never presented as real
4. **Graceful fallback** — runs without PostgreSQL, external APIs, or model weights
5. **Evidence-weighted trust** — satellite > official > police > citizen > social media

---

## License

MIT License — built for educational and demonstration purposes.
