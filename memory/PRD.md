# Kavach - DPDPA 2023 Compliance Platform PRD

## Original Problem Statement
Build a complete full-stack web application called "Kavach" — an AI-powered DPDPA 2023 compliance platform for Indian enterprises with modules for AI Data Discovery, Consent Lifecycle, Rights Hub, Breach Sentinel, Vendor Trust, Compliance Intelligence, and Children's Data Shield.

## Architecture
- **Frontend**: React + Tailwind CSS (dark theme) + Recharts + React Router
- **Backend**: FastAPI + MongoDB (Motor) + JWT Auth
- **AI**: OpenAI GPT via Emergent LLM Key (DPO Copilot)
- **Database**: MongoDB with 14+ collections

## User Personas
1. **Admin** - Full system access, user management
2. **DPO (Data Protection Officer)** - Compliance oversight, breach management, AI copilot
3. **Analyst** - Data discovery, risk assessment, reporting
4. **Viewer** - Read-only access to dashboards

## Core Requirements
- Dark theme UI matching specification colors (#0D1117 background)
- JWT authentication with role-based access
- Comprehensive seed data for Indian banking scenario (Bharatiya Sahkar Bank)
- Real-time compliance score tracking
- Risk flag management with DPDPA section references
- Breach event tracking with 72-hour DPBI notification countdown
- Consent lifecycle management
- Data principal rights request tracking with SLA monitoring
- Vendor risk assessment

## What's Been Implemented (April 6, 2026)
### MVP Phase 1 - Complete
- [x] JWT Authentication (login/logout/me) with 3 default users
- [x] Dashboard with compliance gauge, stats, charts (Recharts)
- [x] Data Sources management (5 sources: Oracle, PostgreSQL, MSSQL, S3, Mainframe)
- [x] Data Assets listing with 9 assets, risk filtering, column classifications
- [x] Asset Detail with column classification table + risk flags tab
- [x] Consent Manager with dashboard stats + purpose management
- [x] Rights Hub with 5 requests, SLA tracking, status management
- [x] Breach Sentinel with 3 events, 72-hour countdown clock, anomaly detection
- [x] Risk Flags with 8 flags, severity filtering, resolve action
- [x] Vendor Trust with 5 vendors, risk scores, contract status
- [x] Compliance Score with module breakdown, score trend, AI recommendations
- [x] DPO Copilot AI chat (OpenAI via Emergent LLM key)
- [x] Full seed data for Indian banking scenario
- [x] Fixed left sidebar (240px) with grouped navigation
- [x] Responsive dark theme matching design specification

## Prioritized Backlog

### P0 (Critical)
- [ ] Scan job execution (trigger scan from UI)
- [ ] AI column classification during scan
- [ ] Consent notice generation with AI
- [ ] DPBI breach notice generation with AI

### P1 (High)
- [ ] Data lineage visualization (React Flow)
- [ ] Contract AI review for vendors
- [ ] DPIA assessment wizard
- [ ] Report generation with PDF export
- [ ] Children's Data Shield module
- [ ] User management in settings

### P2 (Medium)
- [ ] Consent notice multi-language support
- [ ] Cross-border transfer map visualization
- [ ] Bulk consent renewal campaign
- [ ] Anomaly detection rules engine
- [ ] Email notifications (currently mocked)
- [ ] DigiLocker integration (currently mocked)

## Next Tasks
1. Implement scan job execution with AI classification
2. Build DPBI breach notice generation
3. Add data lineage graph visualization
4. Build Children's Data Shield module
5. Implement report generation with PDF export
