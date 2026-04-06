# Kavach — DPDPA 2023 Compliance Platform

Kavach (meaning *shield* in Hindi) is a full-stack, AI-powered compliance platform that helps Indian banks and enterprises implement the Digital Personal Data Protection Act (DPDPA) 2023. It automatically discovers personal data across all systems, manages consents, handles citizen rights requests, and monitors for breaches — all in one place.

---

## Why Kavach?

India's DPDPA 2023 is now law. Every organisation that processes personal data of Indian citizens must comply by May 2027. Penalties for non-compliance go up to ₹250 crore per violation.

The problem: most large Indian organisations — especially banks — have decades of personal data scattered across hundreds of systems, legacy mainframes, COBOL flat files, S3 buckets, and SharePoint drives. Nobody knows exactly what data they hold, where it lives, or whether it is protected.

Kavach solves this by combining a deep-crawling data discovery engine with GPT-powered AI to automatically find, classify, and risk-score every piece of personal data — then manage the full compliance lifecycle on top of it.

---

## MVP Modules (v1.0)

These four modules are built and functional in this version:

| Module | What it does | Status |
|--------|-------------|--------|
| **Dashboard** | Compliance overview — scores, risk stats, charts, recent activity | ✅ Built |
| **AI Data Discovery** | Crawls data sources, classifies every column using GPT, builds a living data map | ✅ Built |
| **Consent Manager** | Manages give, withdraw, renew consent with multi-language notices | ✅ Built |
| **Breach Sentinel** | Detects breaches, runs 72-hour DPBI notification countdown, drafts official notices | ✅ Built |

### Planned Modules (coming in future versions)

| Module | What it does |
|--------|-------------|
| **Data Principal Rights Hub** | Access, correction, erasure requests with 90-day SLA automation |
| **Compliance Intelligence** | DPDPA health score, DPIA automation, AI audit report writer, DPO co-pilot |
| **Vendor Trust Manager** | AI contract review, third-party risk scores, cross-border transfer logging |
| **Children's Data Shield** | DigiLocker age verification, guardian consent, automatic data blocking |

---

## Tech Stack

### Frontend
- **React 18** + TypeScript
- **Tailwind CSS** — dark theme design system
- **TanStack Query** — server state and live polling
- **React Flow** — data lineage graph
- **Recharts** — compliance charts and dashboards
- **Zustand** — global state management

### Backend
- **Python 3.11** + FastAPI
- **Celery** + Redis — background scanning jobs and schedulers
- **MongoDB** — primary database (all collections)
- **Pydantic v2** — data validation and schema enforcement
- **python-jose** — JWT authentication
- **Cryptography (Fernet)** — credential encryption

### AI
- **OpenAI GPT** via Emergent LLM key
- Column classification, consent notice generation, breach notice drafting
- Regex fallback layer for Aadhaar, PAN, card number pattern detection

### Infrastructure
- **Docker Compose** — single command deployment
- **Nginx** — reverse proxy

---

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- No API keys needed — AI runs via Emergent LLM key (pre-configured)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/kavach.git
cd kavach
```

### 2. Configure environment

```bash
cp .env.example .env
```

The `.env.example` file looks like this:

```env
# MongoDB
MONGODB_URL=mongodb://mongo:27017
MONGODB_DB_NAME=kavach

# Redis
REDIS_URL=redis://redis:6379/0

# Auth
SECRET_KEY=your_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# AI (pre-configured via Emergent LLM key)
OPENAI_API_KEY=your_openai_key_here

# Email (mocked in this version)
EMAIL_MOCK=true

# App
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

> To generate a secure SECRET_KEY:
> ```bash
> openssl rand -hex 32
> ```

### 3. Start the application

```bash
docker compose up --build
```

This starts all services automatically:

| Service | Role | Port |
|---------|------|------|
| MongoDB | Primary database | 27017 |
| Redis | Job queue and cache | 6379 |
| Backend | FastAPI server | 8000 |
| Celery Worker | Background scanning tasks | — |
| Celery Beat | Scheduled tasks (SLA checks, breach countdowns) | — |
| Frontend | React application | 3000 |
| Nginx | Reverse proxy | 80 |

On first startup the backend automatically creates all MongoDB collections, indexes, and loads the full demo dataset.

### 4. Open the application

```
http://localhost:80
```

### 5. Log in with demo credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@bharatiyabank.example.com | Kavach@2024 | Full access to all modules |
| DPO | dpo@bharatiyabank.example.com | Kavach@2024 | Compliance, breach, consent tools |
| Analyst | analyst@bharatiyabank.example.com | Kavach@2024 | View and run scans only |

---

## Demo Data

The application comes pre-loaded with realistic Indian banking data for **Bharatiya Sahkar Bank Ltd** — a fictional bank. This lets you explore all features immediately without connecting a real database.

### Pre-loaded data sources

| Source | Type | Records | Risk |
|--------|------|---------|------|
| Core Banking System (CBS) | Oracle (simulated) | 28,47,392 customers | 🔴 Critical |
| Customer Data Warehouse | PostgreSQL (simulated) | 28,47,392 records | 🔴 Critical |
| HR Management System | MSSQL (simulated) | 8,432 employees | 🔴 Critical |
| KYC Document Storage | S3 (simulated) | 84,32,891 files | 🔴 Critical |
| Legacy Loan System (1994) | Mainframe COBOL (simulated) | 43,291 records | 🔴 Critical |

### Pre-loaded risk flags (open violations)

| Flag | Asset | Severity | DPDPA Section |
|------|-------|----------|---------------|
| Aadhaar stored in plain text | CBS.CUSTOMER_MASTER | 🔴 Critical | Section 8(4) |
| 12,847 minor accounts with no parental consent | CBS.CUSTOMER_MASTER | 🔴 Critical | Section 9 |
| Medical records unencrypted | HRMS.LEAVE_MEDICAL_RECORDS | 🔴 Critical | Section 8(4) |
| 84L KYC documents with no retention policy | S3.KYC_DOCUMENTS | 🟡 High | Section 8(7) |
| SMS vendor contract expired 6 months ago | Vendor: Legacy SMS | 🔴 Critical | Section 8(2) |
| Cross-border transfer to USA not logged | Google Analytics | 🟡 High | Section 16 |
| 8.4L customer records with no consent | CBS.CUSTOMER_MASTER | 🟡 High | Section 6 |

### Pre-loaded compliance score

```
Overall DPDPA Score: 61 / 100  (Needs Improvement)

  Data Discovery        78 / 100  ████████░░
  Consent Management    55 / 100  █████░░░░░
  Rights Management     70 / 100  ███████░░░
  Breach Readiness      72 / 100  ███████░░░
  Vendor Management     44 / 100  ████░░░░░░
  Children Protection   38 / 100  ███░░░░░░░
```

---

## MongoDB Collections

All data is stored in MongoDB. Key collections:

```
kavach/
├── organisations           # Tenant details and DPO info
├── users                   # Login accounts with roles
├── data_sources            # DB connection configs (credentials encrypted)
├── data_assets             # Discovered tables and files
├── column_classifications  # AI classification result per column
├── risk_flags              # Open DPDPA violations
├── scan_jobs               # Scan history and live progress
├── data_lineage            # How data flows between systems
├── consent_purposes        # Why data is collected
├── consent_notices         # Notice text per language
├── data_principals         # Customers and individuals
├── consents                # Consent records with full audit trail
├── rights_requests         # Access, erasure, correction requests
├── breach_events           # Breach incidents with timelines
├── anomaly_detections      # Potential breach signals
├── vendors                 # Third-party data processors
├── vendor_contracts        # DPA and contract records
└── compliance_scores       # DPDPA health score history
```

---

## AI Features

All AI features use OpenAI GPT via the Emergent LLM key.

### 1. Column classification
The core AI feature. For each database column the AI receives the column name, data type, 100–300 masked sample values, and table + source system context. It returns the DPDPA category, subcategory, confidence score (0–100), reasoning, and risk tier.

Columns with confidence below 70 are automatically flagged for human review.

### 2. Consent notice generation
Generates plain-language consent notices in 10 Indian languages: English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, and Punjabi.

### 3. Breach notice drafting
Automatically drafts a formal DPBI notification notice when a breach is logged — includes incident description, affected data categories, number of principals impacted, and remediation steps taken.

### 4. Regex fallback (no AI needed)
Even without AI, the PII pattern engine independently detects:
- Aadhaar numbers (12-digit, XXXX-XXXX-XXXX format)
- PAN cards (ABCDE1234F format)
- Credit and debit card numbers (16-digit with Luhn check)
- Indian mobile numbers (10-digit starting 6–9)
- Email addresses
- IFSC codes

---

## Authentication

JWT-based authentication with three roles:

| Role | Permissions |
|------|------------|
| **Admin** | Full access — manage users, sources, all settings |
| **DPO** | Compliance tools — consent, breach, rights, reports |
| **Analyst** | Read access — view scans, assets, dashboards |

Tokens expire after 8 hours. All passwords are bcrypt hashed. Credentials for connected data sources are encrypted using Fernet symmetric encryption before being stored in MongoDB.

---

## Email Notifications

Email is **mocked** in this version. All notifications are logged to the console instead of being sent. This includes:

- SLA breach alerts to DPO (rights requests overdue)
- 72-hour and 48-hour breach notification countdown warnings
- Rights request assignment notifications
- Consent withdrawal confirmations

To enable real email in a future version, set `EMAIL_MOCK=false` in `.env` and add SMTP credentials.

---

## How a Scan Works

```
1. Add a data source (e.g. Core Banking Oracle DB)
          ↓
2. Kavach connects using read-only credentials
          ↓
3. Crawler extracts table names, column names, data types
          ↓
4. Smart sampler fetches 100–300 masked values per column
   (real values are masked before leaving the org network)
          ↓
5. Columns sent in batches of 20 to GPT for classification
          ↓
6. GPT returns DPDPA category + confidence + reasoning per column
          ↓
7. Risk engine applies rules on top of AI classification:
   sensitive data + unencrypted  →  CRITICAL flag
   children data found           →  CRITICAL flag
   no retention policy           →  HIGH flag
   data shared with vendor       →  HIGH flag
          ↓
8. Results saved to MongoDB
          ↓
9. Dashboard updates with new risk picture
```

---

## Project Structure

```
kavach/
├── frontend/                   # React application
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard/
│   │   │   ├── DataSources/
│   │   │   ├── Assets/
│   │   │   ├── ConsentManager/
│   │   │   └── BreachSentinel/
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # TanStack Query hooks
│   │   ├── store/              # Zustand global state
│   │   └── lib/                # API client and utilities
│   ├── Dockerfile
│   └── package.json
│
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/                # Route handlers
│   │   │   ├── auth.py
│   │   │   ├── sources.py
│   │   │   ├── assets.py
│   │   │   ├── consent.py
│   │   │   ├── breach.py
│   │   │   └── risk.py
│   │   ├── models/             # Pydantic models
│   │   ├── services/           # Business logic
│   │   │   ├── crawler.py      # Data source scanning
│   │   │   ├── classifier.py   # AI classification pipeline
│   │   │   ├── risk_engine.py  # Risk scoring rules
│   │   │   └── ai_service.py   # OpenAI GPT integration
│   │   ├── tasks/              # Celery background tasks
│   │   └── db/                 # MongoDB connection
│   ├── seed_data.py            # Demo data loader
│   ├── Dockerfile
│   └── requirements.txt
│
├── nginx/
│   └── nginx.conf
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## DPDPA Reference

Key sections Kavach maps violations to:

| Section | Requirement |
|---------|------------|
| Section 6 | Valid consent must be obtained before processing personal data |
| Section 8(2) | Data processors must operate under valid written contracts |
| Section 8(4) | Appropriate technical and organisational security safeguards required |
| Section 8(7) | Personal data must be erased when the purpose is complete |
| Section 9 | Processing children's data requires verifiable parental consent |
| Section 16 | Cross-border data transfers only permitted to notified countries |

---

## Known Limitations (MVP v1.0)

- Real database crawling supports PostgreSQL and MySQL. Oracle, SAP, Mainframe, and S3 connectors use simulated scan responses with pre-seeded data.
- Email notifications are mocked — all alerts are logged to the console.
- DigiLocker integration for children's age verification returns realistic mock responses.
- DPBI portal submission generates the official notice but does not submit to the real government portal.
- The Rights Hub, Vendor Trust, Compliance Intelligence, and Children's Shield modules are visible in the sidebar and marked as Coming Soon — full builds planned for v2.0.

---

## Roadmap

### v1.0 — Current
- ✅ Dashboard with DPDPA compliance score
- ✅ AI Data Discovery and column classification
- ✅ Consent Manager with multi-language notice generation
- ✅ Breach Sentinel with 72-hour DPBI countdown
- ✅ JWT authentication with role-based access
- ✅ Realistic seed data (Bharatiya Sahkar Bank)
- ✅ MongoDB backend
- ✅ Docker Compose single-command deployment

### v2.0 — Planned
- 🔲 Data Principal Rights Hub with 90-day SLA automation
- 🔲 Vendor Trust Manager with AI contract review
- 🔲 Compliance Intelligence — DPO co-pilot chat
- 🔲 Children's Data Shield with real DigiLocker integration
- 🔲 Real Oracle, SAP, and Mainframe connectors
- 🔲 PDF audit report generation and download
- 🔲 Real SMTP email notifications

### v3.0 — Future
- 🔲 Mobile app for DPO breach alerts
- 🔲 Public API for third-party integrations
- 🔲 Consent widget SDK for embedding into org websites
- 🔲 Direct DPBI portal submission
- 🔲 RBI, SEBI, and IRDAI sectoral rule overlays
- 🔲 Multi-tenant SaaS mode

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add: your feature description'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## License

This project is proprietary software. All rights reserved.

© 2024 Kavach — DPDPA Compliance Platform

---

## Disclaimer

Kavach is a compliance assistance tool and does not constitute legal advice. Organisations should consult qualified legal counsel for DPDPA compliance guidance. All sample data in this application is entirely fictional and does not represent any real individuals or organisations.
