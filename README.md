# AI-Based Cloud Architecture Optimization

> **Autonomous, explainable, and proactive cloud infrastructure optimization with human-in-the-loop safety and governance.**

[![Backend Tests](https://img.shields.io/badge/Backend%20E2E-13%2F13%20Passed-brightgreen.svg)](#backend-verification)
[![AI Models](https://img.shields.io/badge/AI%20Models-48%20Pre--trained-blue.svg)](#aiml-service)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Architecture](https://img.shields.io/badge/AWS-EC2%20%7C%20RDS%20%7C%20CloudWatch-orange.svg)](#system-architecture)

---

## Table of Contents

1. [Overview & Core Value](#overview--core-value)
2. [Key Architecture Pillars](#key-architecture-pillars)
3. [System Architecture](#system-architecture)
4. [Component Deep Dive](#component-deep-dive)
   - [AI / ML Analytics Pipeline (`ai-service`)](#1-aiml-analytics-pipeline-ai-service)
   - [Backend API Server (`backend`)](#2-backend-api-server-backend)
   - [Administrator Dashboard (`frontend`)](#3-administrator-dashboard-frontend)
   - [Infrastructure Provisioning (Terraform)](#4-infrastructure-provisioning-terraform)
5. [Prerequisites](#prerequisites)
6. [Complete Step-by-Step Setup Guide](#complete-step-by-step-setup-guide)
   - [Step 1: Database Setup & Configuration](#step-1-database-setup--configuration)
   - [Step 2: AI / ML Service Setup](#step-2-aiml-service-setup)
   - [Step 3: Backend API Setup](#step-3-backend-api-setup)
   - [Step 4: Frontend Dashboard Setup](#step-4-frontend-dashboard-setup)
7. [Running the Full Stack](#running-the-full-stack)
8. [API Reference & Service Endpoints](#api-reference--service-endpoints)
9. [Verification & Testing](#verification--testing)
10. [Troubleshooting & Known Gotchas](#troubleshooting--known-gotchas)

---

## Overview & Core Value

Cloud environments frequently suffer from over-provisioning, unmanaged idle workloads, and sudden capacity bottlenecks that trigger unexpected bills or service disruptions. Traditional rule-based alerts are reactive, noisy, and lack structural cost-performance context.

**AI-Based Cloud Architecture Optimization** bridges this gap by combining time-series forecasting, unsupervised anomaly detection, real AWS pricing models, and interactive human-in-the-loop review. It proactively detects efficiency opportunities (such as rightsizing EC2 instances, cleaning up provisioned IOPS surges, or optimizing RDS tiers) and formulates actionable, explainable recommendations before waste accumulates.

---

## Key Architecture Pillars

| Pillar | Description |
| :--- | :--- |
| **🧠 AI-Assisted** | Leverages multi-horizon regression models (Gradient Boosting, Decision Trees) and Isolation Forests trained on production telemetry (BitBrains VM & AWS CloudWatch benchmarks). |
| **🛡️ Proactive** | Forecasts capacity and resource demand **1 to 24 hours ahead**, enabling preventative scaling rather than reacting to threshold breaches. |
| **📑 Explainable** | Produces explicit configuration diffs (e.g., `c5.2xlarge` $\rightarrow$ `c5.xlarge`), estimated monthly savings, and structured risk assessments. |
| **👥 Human-in-the-Loop** | Never modifies production infrastructure silently. All recommendations require explicit administrator approval or rejection, complete with an immutable audit trail. |

---

## System Architecture

### Architectural Flowchart

![System Architecture](docs/images/architecture.png)

### High-Level Architecture Diagram

```mermaid
flowchart TB
    subgraph AWS_Telemetry ["AWS Telemetry"]
        direction TB
        CW["CloudWatch<br/>(Logs & Metrics)"]
        EC2["EC2<br/>(CPU, Memory, Latency)"]
        RDS["RDS<br/>(Performance & Cost)"]
    end

    subgraph AI_Pipeline ["AI / ML Pipeline"]
        direction LR
        TN["1. Telemetry<br/>Normalization<br/><i>Cleans & structures AWS data</i>"]
        FC["2. Forecasting<br/><i>Predicts demand 1-24h ahead</i>"]
        AD["3. Anomaly Detection<br/><i>Isolation Forest & severity scoring</i>"]
        RE["4. Recommendation Engine<br/><i>Combines forecasts & pricing</i>"]
        HR["5. Human Review<br/><i>Approve / Reject workflow</i>"]

        TN --> FC --> AD --> RE --> HR
    end

    subgraph Dashboard ["Administrator Dashboard"]
        UI["Web UI Console<br/>• Real-time Telemetry Charts<br/>• Forecast Trends & Bounds<br/>• Action Approval Modals<br/>• Audit Logs"]
        HITL["Human-in-the-Loop<br/><i>Safety & Governance Control</i>"]
        UI <--> HITL
    end

    subgraph Monitoring ["CloudWatch Monitoring & Analytics"]
        direction LR
        MA["Metrics Analysis"] --- MAD["Anomaly Detection"] --- MFC["Forecasting"] --- MHM["Health Monitoring"]
    end

    subgraph IaC ["Infrastructure Provisioning (Terraform)"]
        direction LR
        TCW["CloudWatch"] --- TEC2["EC2"] --- TRDS["RDS"] --- TTF["Terraform Remote State"]
    end

    subgraph Execution ["(Optional) Apply Changes to AWS"]
        APPLY["Controlled / Scripted Orchestration<br/><i>Manual confirmation; never automatic</i>"]
    end

    AWS_Telemetry -- "Metrics & Logs" --> TN
    Monitoring -. "Monitors Pipeline" .-> AI_Pipeline
    HR -- "Approved / Rejected" --> UI
    IaC -. "Provisions Resources" .-> Monitoring
    HR -. "On Approval" .-> Execution
```

---

## Component Deep Dive

### 1. AI/ML Analytics Pipeline (`ai-service`)
- **Framework**: Python 3.11, FastAPI, Uvicorn, Pydantic, Scikit-Learn 1.5.1, Joblib, Pandas, NumPy.
- **Pre-trained Artifacts**: 48 production model artifacts (`.joblib`) covering multi-dimensional metrics (CPU utilization, memory usage, network in/out, disk write throughput) across BitBrains and AWS EC2/RDS workloads.
- **Forecasting Engine**: Multi-step recursive regression forecasting with confidence intervals.
- **Anomaly Detection**: Unsupervised Isolation Forest yielding contamination scores and severity grades (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Cost Engine**: Real AWS on-demand pricing calculator for compute instances and EBS provisioned storage.

### 2. Backend API Server (`backend`)
- **Runtime**: Node.js (v18+) with Express.js.
- **Database ORM**: PostgreSQL with Prisma ORM (`@prisma/client` and `@prisma/adapter-pg`).
- **Core Entities**:
  - `AwsMetric`: Time-series performance metrics with JSON metadata.
  - `Anomaly`: Flagged metric deviations with severity scores.
  - `Forecast`: Projected metric trajectories with confidence bounds.
  - `Recommendation`: Proposed rightsizing and architectural changes with status (`ACTIVE`, `APPROVED`, `REJECTED`).
  - `SystemLog`: Audit trail capturing administrator review actions and system events.
- **Security & Integrity**: Helmet HTTP headers, CORS filtering, Zod schema validation.

### 3. Administrator Dashboard (`frontend`)
- **Technology**: React 18, Vite, Tailwind CSS, TanStack React Query, Recharts, Lucide Icons.
- **Features**:
  - **Executive Summary**: Potential monthly savings, open anomaly counts, cluster health score.
  - **Live Telemetry & Anomalies**: High-density interactive metric charts with threshold indicators.
  - **Capacity & Cost Forecasting**: Visualized prediction paths with upper and lower confidence envelopes.
  - **Approval Modal Flow**: Side-by-side configuration diffs (`Current` vs. `Recommended`), risk indicators, and optional rejection audit reasons.
  - **Dual Operation Mode**: Seamless switching between live backend connection and local mock simulation (`VITE_USE_MOCK`).

### 4. Infrastructure Provisioning (Terraform)
- Infrastructure-as-Code modules for managing EC2 instance groups, RDS database instances, CloudWatch alarm policies, and secure remote backend state.

---

## Prerequisites

Ensure the following runtimes and tools are installed:

- **Node.js**: v18.0.0 or higher (v20+ / v24+ supported)
- **npm**: v9.0.0 or higher
- **Python**: v3.10 or v3.11 (Python 3.11 recommended)
- **PostgreSQL**: v14.0 or higher (tested with PostgreSQL 18 locally or Supabase / AWS RDS)
- **Git**

---

## Complete Step-by-Step Setup Guide

### Step 1: Database Setup & Configuration

1. **Verify or Start PostgreSQL**
   Ensure your PostgreSQL server is running on port `5432`.

2. **Configure Backend Environment Variables**
   Navigate to the `backend/` directory and configure `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edit `backend/.env` with your PostgreSQL credentials:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/cloud_optimizer"
   PORT=5000
   ```
   > [!NOTE]
   > If your password contains special characters (e.g. `@`), encode them (e.g. `@` becomes `%40`). Use `127.0.0.1` instead of `localhost` to avoid IPv6 socket connection issues on Windows.

3. **Install Backend Dependencies**
   ```bash
   npm install
   ```

4. **Initialize Database, Apply Schema & Seed Initial Data**
   Run the automated utility scripts provided in `backend/scripts/`:
   ```bash
   # Automatically create the cloud_optimizer database if it does not exist
   node scripts/ensure-db.js

   # Push Prisma schema to PostgreSQL
   npx prisma db push

   # Generate Prisma client
   npx prisma generate

   # Seed initial telemetry, anomalies, forecasts, and recommendations
   node scripts/seed-db.js

   # Verify database connectivity and schema integrity
   node scripts/verify-db.js
   ```

---

### Step 2: AI / ML Service Setup

1. **Navigate to `ai-service/`**
   ```bash
   cd ../ai-service
   ```

2. **Create and Activate Python Virtual Environment**
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install Dependencies**
   Install the pinned packages from `app/requirements.txt`:
   ```bash
   pip install -r app/requirements.txt
   ```
   > [!IMPORTANT]
   > `scikit-learn==1.5.1` is strictly pinned to ensure 100% binary deserialization compatibility with the pre-trained `.joblib` model artifacts.

4. **Verify Model Deserialization & Run Test Suite**
   ```bash
   python test_api_endpoints.py
   ```
   *Expected output: All 6 test suites (`/health`, `/forecast`, `/anomaly`, `/cost`, `/recommend`, `/analyze`) pass.*

---

### Step 3: Backend API Setup

1. **Navigate to `backend/`**
   ```bash
   cd ../backend
   ```

2. **Run End-to-End Test Suite**
   Ensure all API controllers, database queries, and AI provider integration endpoints pass:
   ```bash
   npm test
   ```
   *Expected output: `=== API TEST SUMMARY: 13/13 ENDPOINTS/WORKFLOWS PASSED ===`*

---

### Step 4: Frontend Dashboard Setup

1. **Navigate to `frontend/`**
   ```bash
   cd ../frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration (Optional)**
   By default, Vite proxies `/api` directly to `http://localhost:5000`. If you wish to use the client-side mock store for offline demonstration, create `frontend/.env`:
   ```env
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=/api/v1
   ```

---

## Running the Full Stack

Open three terminal windows (or run as background processes) to start all three services simultaneously:

### 1. Terminal 1: AI / ML Service
```bash
cd ai-service/app
# With the virtual environment activated:
uvicorn main:app --port 8000 --reload
```
- **Service URL**: `http://127.0.0.1:8000`
- **Swagger Documentation**: `http://127.0.0.1:8000/docs`

### 2. Terminal 2: Backend API
```bash
cd backend
npm start
```
- **Service URL**: `http://localhost:5000`
- **API Base**: `http://localhost:5000/api/v1`

### 3. Terminal 3: Frontend Dashboard
```bash
cd frontend
npm run dev
```
- **Dashboard URL**: `http://localhost:5173`

---

## API Reference & Service Endpoints

### Backend REST API (`http://localhost:5000/api/v1`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Basic service and PostgreSQL health status |
| `GET` | `/system/health` | Overall system health score, service latency, and uptime |
| `GET` | `/ai/status` | Connectivity check to FastAPI ML service |
| `GET` | `/dashboard/summary` | Aggregated cluster spend, potential savings, and risk scores |
| `GET` | `/telemetry/metrics` | Historical AWS CloudWatch metrics (CPU, Memory, IOPS) |
| `GET` | `/telemetry/resources` | Discovered AWS EC2 and RDS resource metadata |
| `GET` | `/anomalies` | Detected anomalies with severity ratings and timestamps |
| `GET` | `/forecasts` | Time-series forecast records with upper/lower confidence bounds |
| `POST` | `/forecast` | Trigger recomputation of forecast models via AI service |
| `GET` | `/recommendations` | Active rightsizing and architecture optimization proposals |
| `POST` | `/recommendations/:id/approve` | Human-in-the-loop approval action with audit logging |
| `POST` | `/recommendations/:id/reject` | Human-in-the-loop rejection action with audit logging |
| `GET` | `/history` | Complete historical audit log of review actions |

### AI / ML Service API (`http://localhost:8000`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Model registry readiness and count of loaded models |
| `POST` | `/forecast` | Predictive multi-step time-series forecasting |
| `POST` | `/anomaly` | Isolation Forest anomaly detection and scoring |
| `POST` | `/cost` | AWS EC2/RDS pricing and waste calculation |
| `POST` | `/recommend` | Decision logic generating optimization actions (`SCALE_OUT`, `SCALE_IN`, etc.) |
| `POST` | `/analyze` | End-to-end telemetry analysis pipeline |

---

## Verification & Testing

Verify that all three tiers are communicating seamlessly:

```powershell
# 1. Check AI service health
Invoke-RestMethod -Uri "http://localhost:8000/health"

# 2. Check Backend API system health
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/system/health"

# 3. Check Frontend proxy connection to Backend
Invoke-RestMethod -Uri "http://localhost:5173/api/v1/health"
```

Expected response from the proxy test:
```json
{
  "status": "ok",
  "database": "connected",
  "databaseName": "cloud_optimizer",
  "engine": "PostgreSQL 18.2",
  "message": "Backend API and database are running"
}
```

---

## Troubleshooting & Known Gotchas

1. **`ModuleNotFoundError: No module named '_loss'` in AI Service**:
   - **Cause**: Pre-trained `.joblib` models were serialized with scikit-learn 1.5.1. Newer versions (e.g. 1.6+ or 1.9+) fail to load the loss function estimators.
   - **Fix**: Ensure your virtual environment uses `scikit-learn==1.5.1` (pinned in `requirements.txt`).

2. **PostgreSQL IPv6 Connection Failure (`connection to ::1 failed`)**:
   - **Cause**: On Windows systems, `localhost` may resolve to IPv6 `::1`, which may not be mapped in `pg_hba.conf`.
   - **Fix**: Use `127.0.0.1` explicitly in `backend/.env`.

3. **Special Characters in PostgreSQL Password**:
   - **Cause**: If your password contains `@`, `#`, or `/`, URL parsing breaks.
   - **Fix**: URL-encode special characters in `DATABASE_URL` (e.g. `password@123` becomes `password%40123`).

4. **Port Conflicts**:
   - `5000`: Backend API server (change via `PORT` in `backend/.env` if needed).
   - `8000`: AI / ML FastAPI service.
   - `5173`: Frontend Vite development server.

---

## Project Structure

```text
AI-Based-Cloud-Architecture-Optimization/
├── ai-service/                   # FastAPI Machine Learning Service
│   ├── app/                      # Application code (main.py, cost_engine.py, inference.py)
│   ├── data/                     # Training datasets (BitBrains, NAB benchmarks)
│   ├── models/                   # 48 Pre-trained .joblib model artifacts
│   ├── test_api_endpoints.py     # End-to-end test suite for AI endpoints
│   └── requirements.txt          # Pinned Python dependencies (scikit-learn==1.5.1)
├── backend/                      # Node.js / Express API Server
│   ├── prisma/                   # Prisma database schema
│   ├── scripts/                  # DB bootstrap, seed, verify, and test scripts
│   ├── src/                      # Controllers, routes, services, middleware
│   ├── package.json              # Backend dependencies
│   └── .env.example              # Environment variables template
├── docs/                         # Project documentation and test evidence
│   ├── images/                   # Architecture diagrams and visual assets
│   │   └── architecture.png      # Official system architecture diagram
│   ├── API_TESTING_REPORT.md     # API regression testing report
│   ├── DEFECT_REGISTER.md        # Comprehensive defect register & resolutions
│   └── postman/                  # Postman test collections
├── frontend/                     # React Vite Administrator Dashboard
│   ├── src/                      # UI components, pages, hooks, mock data
│   ├── tailwind.config.js        # Design system styles and tokens
│   ├── vite.config.js            # Vite build setup and /api proxy configuration
│   └── package.json              # Frontend dependencies
└── README.md                     # Project documentation (this file)
```
